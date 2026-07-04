// Client-side mirror of pure helpers from supabase/functions/_shared/game-logic.ts.
// Used by the gameplay page to compute the current target without a server call.

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

// Stable avatar emoji per username (deterministic).
const AVATARS = ["🍜", "🍢", "🥟", "🍡", "🍱", "🍙", "🥠", "🍘", "🍤", "🍧"];
export function avatarFor(username: string | null | undefined): string {
  const s = username ?? "Pemain";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
