// Edge function: draw-card
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { getTargetForTurn, performDraw } from "../_shared/game-logic.ts";

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

const BodySchema = z.object({
  roomId: z.string().uuid(),
  cardIndex: z.number().int().min(0),
});

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
      _action: "draw-card",
      _limit: 30,
      _window_seconds: 60,
    });
    if (rlOk === false) return json({ error: "Terlalu banyak percobaan" }, 429);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid body" }, 400);
    const { roomId, cardIndex } = parsed.data;

    const { data: gameState } = await service
      .from("game_states")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();
    if (!gameState) return json({ error: "Game tidak ditemukan" }, 404);
    if (gameState.phase !== "playing") return json({ error: "Game tidak sedang berjalan" }, 400);
    if (gameState.current_turn_user_id !== user.id) return json({ error: "Bukan giliran kamu" }, 403);

    const { data: allHands } = await service
      .from("player_hands")
      .select("*")
      .eq("game_state_id", gameState.id);
    const hands = allHands ?? [];

    const safeSet = new Set<string>();
    for (const h of hands) if (h.is_safe) safeSet.add(h.user_id);

    const fromUserId = getTargetForTurn(gameState.turn_order, user.id, safeSet);
    if (!fromUserId) {
      return json({ error: "Tidak ada lawan yang bisa diambil kartunya. Game mungkin sudah selesai." }, 400);
    }

    const fromHand = hands.find((h: any) => h.user_id === fromUserId);
    if (!fromHand || cardIndex < 0 || cardIndex >= (fromHand.cards as any[]).length) {
      return json({ error: "Indeks kartu tidak valid" }, 400);
    }

    const result = await performDraw(service, gameState as any, hands as any, user.id, cardIndex, roomId);
    if (!result.ok) return json({ error: result.reason }, 400);

    return json({
      ok: true,
      fromUserId: result.fromUserId,
      matched: result.matchedPairIds,
      gameOver: result.gameOver,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});
