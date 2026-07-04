// Penyimpanan sesi pemain berbasis localStorage.
// Tidak menyentuh auth Supabase — proyek pakai "kode akses global + nickname".

const KEY = "jajan_terus_session_v1";

export type JajanSession = {
  nickname: string;
  unlockedAt: number;
};

export function getSession(): JajanSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JajanSession;
  } catch {
    return null;
  }
}

export function setSession(s: JajanSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
