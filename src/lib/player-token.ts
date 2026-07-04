// Token unik per perangkat (bukan auth). Disimpan di localStorage agar
// pemain bisa kembali ke room walau refresh.
const KEY = "jajan_terus_player_token_v1";

export function getPlayerToken(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let t = window.localStorage.getItem(KEY);
  if (!t) {
    t = crypto.randomUUID();
    window.localStorage.setItem(KEY, t);
  }
  return t;
}
