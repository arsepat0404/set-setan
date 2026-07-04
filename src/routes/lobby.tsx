import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { avatarFor } from "@/lib/game-logic";

export const Route = createFileRoute("/lobby")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lobby — Jajan Terus" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LobbyPage,
});

const joinSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Kode harus 6 karakter")
    .regex(/^[A-Z0-9]+$/, "Hanya huruf besar dan angka"),
});

const nicknameSchema = z
  .string()
  .trim()
  .min(3, "Nickname minimal 3 karakter")
  .max(20, "Nickname maksimal 20 karakter")
  .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore");

const EMOJIS = ["🍜", "🍢", "🥟", "🍡"];

function FloatingEmojis() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {EMOJIS.map((e, i) => (
        <motion.span
          key={i}
          className="absolute text-4xl opacity-20"
          style={{ left: `${15 + i * 22}%`, top: `${20 + (i % 2) * 40}%` }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          {e}
        </motion.span>
      ))}
    </div>
  );
}

function NicknameGate({
  onSaved,
  saving,
  onSave,
}: {
  onSaved: boolean;
  saving: boolean;
  onSave: (n: string) => Promise<void>;
}) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const parsed = nicknameSchema.safeParse(nickname);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nickname tidak valid");
      return;
    }
    try {
      await onSave(parsed.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan nickname");
    }
  }

  if (onSaved) return null;

  return (
    <div className="rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-card">
      <h2 className="font-display text-2xl font-bold">Pilih nickname dulu 🍜</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Nama panggilan ini yang akan dilihat pemain lain di meja jajan.
      </p>
      <div className="mt-4 space-y-3">
        <Label htmlFor="nick" className="text-xs font-bold uppercase tracking-wider">
          Nickname
        </Label>
        <Input
          id="nick"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="cth: budi_jajan"
          maxLength={20}
          className="h-12 rounded-2xl border-2"
        />
        <Button
          onClick={submit}
          disabled={saving}
          className="btn-stamp h-12 w-full rounded-2xl font-bold"
        >
          {saving ? "Menyimpan…" : "Simpan & Lanjut"}
        </Button>
        {error && (
          <p className="text-center text-sm font-semibold text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}

function NicknameEditor({
  current,
  saving,
  onSave,
}: {
  current: string;
  saving: boolean;
  onSave: (n: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(current);
  }, [current]);

  async function submit() {
    setError(null);
    const parsed = nicknameSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nickname tidak valid");
      return;
    }
    try {
      await onSave(parsed.data);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan nickname");
    }
  }

  if (!editing) {
    return (
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => setEditing(true)}
          variant="outline"
          className="h-9 rounded-xl border-2 text-xs font-bold"
        >
          Ubah nickname
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2 border-t-2 border-dashed border-foreground/10 pt-4">
      <Label htmlFor="edit-nick" className="text-xs font-bold uppercase tracking-wider">
        Nickname baru
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="edit-nick"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={20}
          className="h-11 rounded-xl border-2"
        />
        <Button onClick={submit} disabled={saving} className="h-11 rounded-xl font-bold">
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button
          onClick={() => {
            setEditing(false);
            setValue(current);
            setError(null);
          }}
          variant="ghost"
          className="h-11 rounded-xl font-bold"
        >
          Batal
        </Button>
      </div>
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function LobbyPage() {
  const { user, profile, loading, nicknameSet, updateNickname, signOut } = useAuth();
  const navigate = useNavigate();

  const [maxPlayers, setMaxPlayers] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [savingNick, setSavingNick] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="font-display text-foreground/60">Memuat…</p>
      </div>
    );
  }

  async function handleSaveNickname(name: string) {
    setSavingNick(true);
    try {
      await updateNickname(name);
      toast.success(`Halo, ${name}! 👋`);
    } finally {
      setSavingNick(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_room_code");
      if (codeErr || !codeData) throw new Error(codeErr?.message ?? "Gagal generate kode");

      const { data: room, error: rErr } = await supabase
        .from("game_rooms")
        .insert({
          room_code: codeData as string,
          host_id: user!.id,
          max_players: maxPlayers,
          timer_seconds: timerSeconds,
        })
        .select()
        .single();
      if (rErr || !room) throw new Error(rErr?.message ?? "Gagal membuat ruangan");

      const { error: pErr } = await supabase.from("room_players").insert({
        room_id: room.id,
        user_id: user!.id,
        is_ready: true,
        player_order: 0,
      });
      if (pErr) throw new Error(pErr.message);

      navigate({ to: "/room/$roomId", params: { roomId: room.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    const parsed = joinSchema.safeParse({ code: joinCode.toUpperCase() });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Kode tidak valid");
      return;
    }
    setJoining(true);
    try {
      const { data: room, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("room_code", parsed.data.code)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!room) {
        toast.error("Kode ruangan tidak ditemukan 😅");
        return;
      }
      if (room.status !== "waiting") {
        toast.error("Game sudah dimulai, tidak bisa gabung");
        return;
      }
      const { count } = await supabase
        .from("room_players")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id);
      const { data: existing } = await supabase
        .from("room_players")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!existing) {
        if ((count ?? 0) >= room.max_players) {
          toast.error("Ruangan sudah penuh!");
          return;
        }
        const { error: jErr } = await supabase.from("room_players").insert({
          room_id: room.id,
          user_id: user!.id,
          is_ready: false,
          player_order: count ?? 0,
        });
        if (jErr) throw new Error(jErr.message);
      }
      navigate({ to: "/room/$roomId", params: { roomId: room.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal bergabung");
    } finally {
      setJoining(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  const username = profile?.username ?? "Pemain";
  const avatar = avatarFor(username);

  return (
    <div className="relative min-h-screen bg-background">
      <FloatingEmojis />
      <main className="relative z-10 mx-auto max-w-4xl px-5 py-10">
        {!nicknameSet ? (
          <NicknameGate
            onSaved={nicknameSet}
            saving={savingNick}
            onSave={handleSaveNickname}
          />
        ) : (
          <>
            <section className="rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-4xl">
                    {avatar}
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-bold">Halo, {username}! 👋</h1>
                    <p className="text-sm text-foreground/60">Siap jajan lagi hari ini?</p>
                  </div>
                </div>
              </div>
              <NicknameEditor
                current={username}
                saving={savingNick}
                onSave={handleSaveNickname}
              />
            </section>


            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <section className="rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-sm">
                <h2 className="font-display text-xl font-bold">🎴 Buat Ruangan</h2>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                      Maks. Pemain
                    </span>
                    <select
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className="mt-1 h-11 w-full rounded-2xl border-2 border-foreground/10 bg-background px-3 font-display"
                    >
                      {[2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} pemain
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                      Timer per Giliran
                    </span>
                    <select
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(Number(e.target.value))}
                      className="mt-1 h-11 w-full rounded-2xl border-2 border-foreground/10 bg-background px-3 font-display"
                    >
                      {[10, 15, 30, 60].map((n) => (
                        <option key={n} value={n}>
                          {n} detik
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="h-12 w-full rounded-2xl font-bold"
                  >
                    {creating ? "Membuat…" : "Buat Ruangan Baru"}
                  </Button>
                </div>
              </section>

              <section className="rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-sm">
                <h2 className="font-display text-xl font-bold">🤝 Gabung Ruangan</h2>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                      Kode Ruangan
                    </span>
                    <Input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="ABC123"
                      maxLength={6}
                      className="mt-1 h-12 rounded-2xl border-2 text-center font-mono text-2xl tracking-[0.5em]"
                    />
                  </label>
                  <Button
                    onClick={handleJoin}
                    disabled={joining || joinCode.length !== 6}
                    className="h-12 w-full rounded-2xl font-bold"
                  >
                    {joining ? "Bergabung…" : "Gabung"}
                  </Button>
                </div>
              </section>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="h-11 rounded-2xl border-2 font-bold">
                <Link to="/leaderboard">🏆 Leaderboard</Link>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="h-11 rounded-2xl font-bold text-foreground/70"
              >
                Keluar
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
