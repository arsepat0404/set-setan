// Edge function: timer-tick
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { getTargetForTurn, getNextActiveTurn, performDraw } from "../_shared/game-logic.ts";

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

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid body" }, 400);
    const { roomId } = parsed.data;

    const service = createClient(supabaseUrl, serviceKey);

    // Rate limit per room (use roomId as _user_id)
    const { data: rlOk } = await service.rpc("consume_rate_limit", {
      _user_id: roomId,
      _action: "timer-tick",
      _limit: 40,
      _window_seconds: 60,
    });
    if (rlOk === false) return json({ ok: true, action: "rate_limited" });

    const { data: gameState } = await service
      .from("game_states")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();
    if (!gameState || gameState.phase !== "playing") {
      return json({ ok: true, action: "none" });
    }

    const { data: room } = await service
      .from("game_rooms")
      .select("timer_seconds")
      .eq("id", roomId)
      .maybeSingle();
    const timerSeconds = room?.timer_seconds ?? 30;

    const turnStarted = gameState.turn_started_at ? new Date(gameState.turn_started_at).getTime() : 0;
    const elapsedMs = Date.now() - turnStarted;
    if (elapsedMs <= timerSeconds * 1000) {
      return json({ ok: true, action: "none" });
    }

    // Timed out — auto draw
    const { data: allHands } = await service
      .from("player_hands")
      .select("*")
      .eq("game_state_id", gameState.id);
    const hands = allHands ?? [];

    const safeSet = new Set<string>();
    for (const h of hands) if (h.is_safe) safeSet.add(h.user_id);

    const currentId = gameState.current_turn_user_id as string;
    const fromUserId = getTargetForTurn(gameState.turn_order, currentId, safeSet);

    if (!fromUserId) {
      const nextTurn = getNextActiveTurn(gameState.turn_order, currentId, safeSet);
      await service
        .from("game_states")
        .update({
          current_turn_user_id: nextTurn,
          turn_started_at: new Date().toISOString(),
        })
        .eq("id", gameState.id);
      return json({ ok: true, action: "advance_only" });
    }

    const fromHand = hands.find((h: any) => h.user_id === fromUserId);
    const handLen = (fromHand?.cards as any[] | undefined)?.length ?? 0;
    if (handLen === 0) {
      return json({ ok: true, action: "none" });
    }
    const cardIndex = Math.floor(Math.random() * handLen);

    const result = await performDraw(service, gameState as any, hands as any, currentId, cardIndex, roomId);
    if (!result.ok) return json({ ok: true, action: "none", reason: result.reason });

    await service.from("game_actions").insert({
      room_id: roomId,
      user_id: currentId,
      action_type: "turn_timeout_auto_draw",
      action_data: { fromUserId, cardIndex, auto: true },
    });

    return json({ ok: true, action: "auto_draw", fromUserId, cardIndex });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});
