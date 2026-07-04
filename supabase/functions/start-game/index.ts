// Edge function: start-game
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { ALL_CARDS } from "../_shared/cards.ts";
import { shuffleArray, autoMatchPairs } from "../_shared/game-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

const BodySchema = z.object({ roomId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const service = createClient(supabaseUrl, serviceKey);

    const { data: rlOk } = await service.rpc("consume_rate_limit", {
      _user_id: user.id,
      _action: "start-game",
      _limit: 3,
      _window_seconds: 60,
    });
    if (rlOk === false) return json({ error: "Terlalu banyak percobaan, tunggu sebentar." }, 429);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid body" }, 400);
    const { roomId } = parsed.data;

    const { data: room } = await service.from("game_rooms").select("*").eq("id", roomId).maybeSingle();
    if (!room) return json({ error: "Room tidak ditemukan" }, 404);
    if (room.status !== "waiting") return json({ error: "Game sudah dimulai" }, 400);
    if (room.host_id !== user.id) return json({ error: "Hanya host yang bisa memulai" }, 403);

    const { data: players } = await service
      .from("room_players")
      .select("*")
      .eq("room_id", roomId)
      .order("player_order", { ascending: true });
    const playerList = players ?? [];
    if (playerList.length < 2) return json({ error: "Minimal 2 pemain untuk memulai" }, 400);
    if (playerList.length > 5) return json({ error: "Terlalu banyak pemain" }, 400);
    const notReady = playerList.some((p: any) => p.user_id !== room.host_id && !p.is_ready);
    if (notReady) return json({ error: "Semua pemain harus siap dulu" }, 400);

    // Shuffle and deal round-robin
    const deck = shuffleArray(ALL_CARDS);
    const N = playerList.length;
    const handsByUser: Record<string, typeof ALL_CARDS> = {};
    for (const p of playerList) handsByUser[p.user_id] = [];
    for (let i = 0; i < deck.length; i++) {
      const target = playerList[i % N].user_id;
      handsByUser[target].push(deck[i]);
    }

    // Auto-match initial pairs
    const finalHands: Record<string, { cards: typeof ALL_CARDS; count: number; safe: boolean }> = {};
    let totalRemaining = 0;
    for (const uid of Object.keys(handsByUser)) {
      const { remaining } = autoMatchPairs(handsByUser[uid]);
      finalHands[uid] = { cards: remaining, count: remaining.length, safe: remaining.length === 0 };
      totalRemaining += remaining.length;
    }

    // Turn order: shuffle player_order
    const turnOrder = shuffleArray(playerList.map((p: any) => p.user_id));
    const nowIso = new Date().toISOString();

    const { data: gameState, error: gsErr } = await service
      .from("game_states")
      .insert({
        room_id: roomId,
        turn_order: turnOrder,
        current_turn_user_id: turnOrder[0],
        phase: "playing",
        turn_started_at: nowIso,
        cards_remaining: totalRemaining,
      })
      .select()
      .single();
    if (gsErr || !gameState) return json({ error: gsErr?.message ?? "Failed to create game state" }, 500);

    const handRows = Object.entries(finalHands).map(([uid, h]) => ({
      game_state_id: gameState.id,
      user_id: uid,
      cards: h.cards,
      card_count: h.count,
      is_safe: h.safe,
      safe_at: h.safe ? nowIso : null,
    }));
    const { error: phErr } = await service.from("player_hands").insert(handRows);
    if (phErr) return json({ error: phErr.message }, 500);

    await service
      .from("game_rooms")
      .update({ status: "playing", started_at: nowIso })
      .eq("id", roomId);

    const cardCounts: Record<string, number> = {};
    for (const [uid, h] of Object.entries(finalHands)) cardCounts[uid] = h.count;

    await service.from("game_actions").insert({
      room_id: roomId,
      user_id: user.id,
      action_type: "start_game",
      action_data: { turn_order: turnOrder, card_counts: cardCounts },
    });

    return json({ ok: true, gameStateId: gameState.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});
