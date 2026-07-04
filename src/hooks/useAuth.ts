import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

const ACCESS_FLAG_KEY = "jajan_access_verified";

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[useAuth] fetchProfile error", error);
    return null;
  }
  return (data as Profile | null) ?? null;
}

/** Nickname is considered "set" when it doesn't match the auto-generated pattern. */
export function isNicknameSet(profile: Profile | null): boolean {
  if (!profile?.username) return false;
  return !/^Pemain_/i.test(profile.username);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setTimeout(() => {
          fetchProfile(u.id).then(setProfile);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id).then(setProfile);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /** Step 1: Verify the shared access code and create an anonymous session. */
  const verifyAccessCode = useCallback(async (code: string) => {
    const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr || !anon.session || !anon.user) {
      throw new Error(anonErr?.message || "Gagal membuat sesi anonim");
    }
    const token = anon.session.access_token;

    const { data: verify, error: vErr } = await supabase.functions.invoke(
      "verify-access-code",
      {
        body: { code },
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (vErr) {
      await supabase.auth.signOut();
      throw new Error(vErr.message || "Gagal memverifikasi kode");
    }
    if (!verify?.valid) {
      await supabase.auth.signOut();
      throw new Error("Kode akses salah");
    }

    try {
      localStorage.setItem(ACCESS_FLAG_KEY, "1");
    } catch {
      /* ignore */
    }
    return anon.user;
  }, []);

  /** Step 2: Set/update the player's nickname (called from the lobby). */
  const updateNickname = useCallback(
    async (nickname: string) => {
      if (!user) throw new Error("Belum login");
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ username: nickname })
        .eq("id", user.id);
      if (pErr) throw new Error(pErr.message);
      const p = await fetchProfile(user.id);
      setProfile(p);
      return p;
    },
    [user],
  );

  /** Backwards-compat: one-shot code + nickname sign-in. */
  const signIn = useCallback(
    async (code: string, nickname: string) => {
      const u = await verifyAccessCode(code);
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ username: nickname })
        .eq("id", u.id);
      if (pErr) console.error("[useAuth] profile update error", pErr);
      const p = await fetchProfile(u.id);
      setProfile(p);
      setUser(u);
      return u;
    },
    [verifyAccessCode],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem(ACCESS_FLAG_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setProfile(null);
  }, []);

  return {
    user,
    profile,
    loading,
    verifyAccessCode,
    updateNickname,
    signIn,
    signOut,
    nicknameSet: isNicknameSet(profile),
  };
}
