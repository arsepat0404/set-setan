// ═══ BUNDLED: timer-tick (all-in-one) ═══

// Shared card catalog for "Jajan Terus" (Old Maid / Setan-setanan).
// 50 paired cards + 1 Setan card = 51 total.

export type CardType = {
  id: string;
  name: string;
  pairId: string | null;
  slug: string;
  isSetan: boolean;
};

export const ALL_CARDS: CardType[] = [
  { id: "c01", name: "Bakso Malang", pairId: "pair_01", slug: "bakso-malang", isSetan: false },
  { id: "c02", name: "Sambal Pedas", pairId: "pair_01", slug: "sambal-pedas", isSetan: false },
  { id: "c03", name: "Mie Instan Rebus", pairId: "pair_02", slug: "mie-instan", isSetan: false },
  { id: "c04", name: "Telur Ceplok", pairId: "pair_02", slug: "telur-ceplok", isSetan: false },
  { id: "c05", name: "Terang Bulan", pairId: "pair_03", slug: "terang-bulan", isSetan: false },
  { id: "c06", name: "Keju & Cokelat", pairId: "pair_03", slug: "keju-cokelat", isSetan: false },
  { id: "c07", name: "Cilok", pairId: "pair_04", slug: "cilok", isSetan: false },
  { id: "c08", name: "Saus Kacang Cilok", pairId: "pair_04", slug: "saus-kacang", isSetan: false },
  { id: "c09", name: "Sate Ayam", pairId: "pair_05", slug: "sate-ayam", isSetan: false },
  { id: "c10", name: "Bumbu Kacang Sate", pairId: "pair_05", slug: "bumbu-kacang", isSetan: false },
  { id: "c11", name: "Siomay", pairId: "pair_06", slug: "siomay", isSetan: false },
  { id: "c12", name: "Saus Kacang Siomay", pairId: "pair_06", slug: "saus-kacang-2", isSetan: false },
  { id: "c13", name: "Gorengan", pairId: "pair_07", slug: "gorengan", isSetan: false },
  { id: "c14", name: "Cabe Rawit", pairId: "pair_07", slug: "cabe-rawit", isSetan: false },
  { id: "c15", name: "Nasi Goreng", pairId: "pair_08", slug: "nasi-goreng", isSetan: false },
  { id: "c16", name: "Kerupuk", pairId: "pair_08", slug: "kerupuk", isSetan: false },
  { id: "c17", name: "Es Cendol", pairId: "pair_09", slug: "es-cendol", isSetan: false },
  { id: "c18", name: "Gula Merah", pairId: "pair_09", slug: "gula-merah", isSetan: false },
  { id: "c19", name: "Martabak Manis", pairId: "pair_10", slug: "martabak-manis", isSetan: false },
  { id: "c20", name: "Kacang Cokelat", pairId: "pair_10", slug: "kacang-cokelat", isSetan: false },
  { id: "c21", name: "Pempek", pairId: "pair_11", slug: "pempek", isSetan: false },
  { id: "c22", name: "Cuko", pairId: "pair_11", slug: "cuko", isSetan: false },
  { id: "c23", name: "Soto Ayam", pairId: "pair_12", slug: "soto-ayam", isSetan: false },
  { id: "c24", name: "Jeruk Nipis", pairId: "pair_12", slug: "jeruk-nipis", isSetan: false },
  { id: "c25", name: "Rendang", pairId: "pair_13", slug: "rendang", isSetan: false },
  { id: "c26", name: "Nasi Putih", pairId: "pair_13", slug: "nasi-putih", isSetan: false },
  { id: "c27", name: "Gado-Gado", pairId: "pair_14", slug: "gado-gado", isSetan: false },
  { id: "c28", name: "Bumbu Kacang Gado", pairId: "pair_14", slug: "bumbu-kacang-2", isSetan: false },
  { id: "c29", name: "Ketoprak", pairId: "pair_15", slug: "ketoprak", isSetan: false },
  { id: "c30", name: "Bawang Goreng", pairId: "pair_15", slug: "bawang-goreng", isSetan: false },
  { id: "c31", name: "Mie Ayam", pairId: "pair_16", slug: "mie-ayam", isSetan: false },
  { id: "c32", name: "Pangsit", pairId: "pair_16", slug: "pangsit", isSetan: false },
  { id: "c33", name: "Nasi Uduk", pairId: "pair_17", slug: "nasi-uduk", isSetan: false },
  { id: "c34", name: "Ayam Goreng", pairId: "pair_17", slug: "ayam-goreng", isSetan: false },
  { id: "c35", name: "Es Teh Manis", pairId: "pair_18", slug: "es-teh", isSetan: false },
  { id: "c36", name: "Gorengan Sore", pairId: "pair_18", slug: "gorengan-2", isSetan: false },
  { id: "c37", name: "Bubur Ayam", pairId: "pair_19", slug: "bubur-ayam", isSetan: false },
  { id: "c38", name: "Kacang Tanah", pairId: "pair_19", slug: "kacang-tanah", isSetan: false },
  { id: "c39", name: "Nasi Kuning", pairId: "pair_20", slug: "nasi-kuning", isSetan: false },
  { id: "c40", name: "Ayam Suwir", pairId: "pair_20", slug: "ayam-suwir", isSetan: false },
  { id: "c41", name: "Klepon", pairId: "pair_21", slug: "klepon", isSetan: false },
  { id: "c42", name: "Kelapa Parut", pairId: "pair_21", slug: "kelapa-parut", isSetan: false },
  { id: "c43", name: "Lemper", pairId: "pair_22", slug: "lemper", isSetan: false },
  { id: "c44", name: "Abon Ayam", pairId: "pair_22", slug: "abon-ayam", isSetan: false },
  { id: "c45", name: "Risoles", pairId: "pair_23", slug: "risoles", isSetan: false },
  { id: "c46", name: "Saus Sambal", pairId: "pair_23", slug: "saus-sambal", isSetan: false },
  { id: "c47", name: "Pastel", pairId: "pair_24", slug: "pastel", isSetan: false },
  { id: "c48", name: "Cabe Rawit Pastel", pairId: "pair_24", slug: "cabe-rawit-2", isSetan: false },
  { id: "c49", name: "Onde-onde", pairId: "pair_25", slug: "onde-onde", isSetan: false },
  { id: "c50", name: "Kacang Hijau", pairId: "pair_25", slug: "kacang-hijau", isSetan: false },
  { id: "c51", name: "Sendok Plastik Patah", pairId: null, slug: "sendok-patah", isSetan: true },
];

// Shared game logic for "Jajan Terus" — used by edge functions.

export type HandRow = {
  id?: string;
  room_id?: string;
  user_id: string;
  cards: CardType[];
  card_count: number;
  is_safe: boolean;
  safe_at?: string | null;
};

export type GameStateRow = {
  id: string;
  room_id: string;
  phase: string;
  turn_order: string[];
  current_turn_user_id: string | null;
  turn_started_at?: string | null;
  cards_remaining?: number | null;
};

export type DrawResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      fromUserId: string;
      drawnCard: CardType;
      matchedPairIds: string[];
      gameOver: boolean;
      nextTurn: string | null;
    };

// ---------- 1. Fisher-Yates shuffle (pure) ----------
export function shuffleArray<T>(array: T[]): T[] {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- 2. Auto-match pairs ----------
export function autoMatchPairs(cards: CardType[]): {
  remaining: CardType[];
  matchedPairIds: string[];
} {
  const seen = new Map<string, number>(); // pairId -> index in cards
  const removed = new Set<number>();
  const matchedPairIds: string[] = [];

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (!c.pairId || c.isSetan) continue;
    if (seen.has(c.pairId)) {
      const j = seen.get(c.pairId)!;
      removed.add(i);
      removed.add(j);
      matchedPairIds.push(c.pairId);
      seen.delete(c.pairId);
    } else {
      seen.set(c.pairId, i);
    }
  }

  const remaining = cards.filter((_, idx) => !removed.has(idx));
  return { remaining, matchedPairIds };
}

// ---------- 3. Next active turn ----------
export function getNextActiveTurn(
  turnOrder: string[],
  currentId: string,
  safeSet: Set<string>,
): string | null {
  const n = turnOrder.length;
  if (n === 0) return null;
  const idx = turnOrder.indexOf(currentId);
  const start = idx === -1 ? 0 : idx;
  for (let step = 1; step <= n; step++) {
    const candidate = turnOrder[(start + step) % n];
    if (!safeSet.has(candidate)) return candidate;
  }
  return null;
}

// ---------- 4. Target for current turn ----------
export function getTargetForTurn(
  turnOrder: string[],
  currentId: string,
  safeSet: Set<string>,
): string | null {
  const n = turnOrder.length;
  if (n === 0) return null;
  const idx = turnOrder.indexOf(currentId);
  const start = idx === -1 ? 0 : idx;
  for (let step = 1; step <= n; step++) {
    const candidate = turnOrder[(start + step) % n];
    if (candidate === currentId) continue;
    if (!safeSet.has(candidate)) return candidate;
  }
  return null;
}

// ---------- 5. performDraw ----------
type ServiceClient = {
  from: (table: string) => any;
};

export async function performDraw(
  serviceClient: ServiceClient,
  gameState: GameStateRow,
  allHands: HandRow[],
  actingUserId: string,
  cardIndex: number,
  roomId: string,
): Promise<DrawResult> {
  // a. Compute initial safeSet
  const handsByUser = new Map<string, HandRow>();
  for (const h of allHands) handsByUser.set(h.user_id, { ...h, cards: [...h.cards] });
  const safeSet = new Set<string>();
  for (const h of handsByUser.values()) if (h.is_safe) safeSet.add(h.user_id);

  // b. Determine target
  const fromUserId = getTargetForTurn(gameState.turn_order, actingUserId, safeSet);
  if (!fromUserId) return { ok: false, reason: "no_target" };

  const fromHand = handsByUser.get(fromUserId);
  const actHand = handsByUser.get(actingUserId);
  if (!fromHand || !actHand) return { ok: false, reason: "hand_not_found" };

  // c. Validate cardIndex
  if (cardIndex < 0 || cardIndex >= fromHand.cards.length) {
    return { ok: false, reason: "invalid_card_index" };
  }

  // d. Drawn card
  const drawnCard = fromHand.cards[cardIndex];

  // e. Update fromHand
  fromHand.cards.splice(cardIndex, 1);
  fromHand.card_count = fromHand.cards.length;
  const wasSafe = fromHand.is_safe;
  fromHand.is_safe = fromHand.card_count === 0;
  const nowIso = new Date().toISOString();
  if (!wasSafe && fromHand.is_safe) fromHand.safe_at = nowIso;

  await serviceClient
    .from("player_hands")
    .update({
      cards: fromHand.cards,
      card_count: fromHand.card_count,
      is_safe: fromHand.is_safe,
      safe_at: fromHand.safe_at ?? null,
    })
    .eq("game_state_id", gameState.id)
    .eq("user_id", fromUserId);

  // f. Add to acting hand, then auto-match
  actHand.cards.push(drawnCard);
  const { remaining, matchedPairIds } = autoMatchPairs(actHand.cards);
  actHand.cards = remaining;
  actHand.card_count = remaining.length;
  const actWasSafe = actHand.is_safe;
  actHand.is_safe = actHand.card_count === 0;
  if (!actWasSafe && actHand.is_safe) actHand.safe_at = nowIso;

  await serviceClient
    .from("player_hands")
    .update({
      cards: actHand.cards,
      card_count: actHand.card_count,
      is_safe: actHand.is_safe,
      safe_at: actHand.safe_at ?? null,
    })
    .eq("game_state_id", gameState.id)
    .eq("user_id", actingUserId);

  // g. Rebuild safeSet
  const newSafeSet = new Set<string>();
  for (const h of handsByUser.values()) if (h.is_safe) newSafeSet.add(h.user_id);

  // h. Next turn
  const nextTurn = getNextActiveTurn(gameState.turn_order, actingUserId, newSafeSet);
  const cardsRemaining = Array.from(handsByUser.values()).reduce(
    (sum, h) => sum + h.card_count,
    0,
  );

  if (nextTurn === null) {
    // i. Game over — rank by safe_at (earlier = better). Player still holding Setan = last.
    const ranked = Array.from(handsByUser.values())
      .map((h) => ({
        user_id: h.user_id,
        safe_at: h.safe_at ? new Date(h.safe_at).getTime() : Number.POSITIVE_INFINITY,
        holds_setan: h.cards.some((c) => c.isSetan),
      }))
      .sort((a, b) => {
        if (a.holds_setan && !b.holds_setan) return 1;
        if (!a.holds_setan && b.holds_setan) return -1;
        return a.safe_at - b.safe_at;
      });

    const entries = ranked.map((r, idx) => ({
      room_id: roomId,
      user_id: r.user_id,
      rank: idx + 1,
      was_setan: r.holds_setan,
    }));
    await serviceClient.from("leaderboard_entries").insert(entries);

    await serviceClient
      .from("game_states")
      .update({
        phase: "finished",
        current_turn_user_id: null,
        cards_remaining: cardsRemaining,
      })
      .eq("id", gameState.id);

    await serviceClient
      .from("game_rooms")
      .update({ status: "finished", finished_at: nowIso })
      .eq("id", roomId);
  } else {
    // j. Advance turn
    await serviceClient
      .from("game_states")
      .update({
        current_turn_user_id: nextTurn,
        turn_started_at: nowIso,
        cards_remaining: cardsRemaining,
      })
      .eq("id", gameState.id);
  }

  // k. Log action (no card details — those must not leak to opponents via game_actions.action_data)
  const cardCounts: Record<string, { card_count: number; is_safe: boolean }> = {};
  for (const h of handsByUser.values()) {
    cardCounts[h.user_id] = { card_count: h.card_count, is_safe: h.is_safe };
  }
  await serviceClient.from("game_actions").insert({
    room_id: roomId,
    user_id: actingUserId,
    action_type: "draw",
    action_data: {
      from_user_id: fromUserId,
      matched: matchedPairIds.length > 0,
      matched_count: matchedPairIds.length,
      next_turn: nextTurn,
      game_over: nextTurn === null,
      card_counts: cardCounts,
    },
  });

  return {
    ok: true,
    fromUserId,
    drawnCard,
    matchedPairIds,
    gameOver: nextTurn === null,
    nextTurn,
  };
}


// ═══ FUNCTION CODE ═══

// Edge function: timer-tick
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

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
