// Shared game logic for "Jajan Terus" — used by edge functions.
import type { CardType } from "./cards.ts";

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
