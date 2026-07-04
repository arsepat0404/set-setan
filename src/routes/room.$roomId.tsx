import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { avatarFor } from "@/lib/game-logic";

export const Route = createFileRoute("/room/$roomId")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Ruangan ${params.roomId.slice(0, 8)} — Jajan Terus` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoomPage,
});

type Room = {
  id: string;
  room_code: string;
  host_id: string;
  status: string;
  max_players: number;
  timer_seconds: number;
};

type PlayerRow = {
  id: string;
  user_id: string;
  is_ready: boolean;
  player_order: number | null;
  joined_at: string | null;
  username: string | null;
};

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [starting, setStarting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function refetch() {
    const { data: r } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();
    if (r) setRoom(r as Room);

    const { data: ps } = await supabase
      .from("room_players")
      .select("id, user_id, is_ready, player_order, joined_at")
      .eq("room_id", roomId)
      .order("player_order", { ascending: true });

    const ids = (ps ?? []).map((p) => p.user_id);
    let usernames: Record<string, string | null> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", ids);
      for (const p of profs ?? []) usernames[p.id] = p.username;
    }
    setPlayers(
      (ps ?? []).map((p) => ({ ...p, username: usernames[p.user_id] ?? "Pemain" })),
    );

    if (r && r.status === "playing") {
      navigate({ to: "/play/$roomId", params: { roomId } });
    }
  }

  useEffect(() => {
    if (!user) return;
    refetch();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = () => {
      channel = supabase
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
          () => refetch(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
          () => refetch(),
        )
        .subscribe((status) => {
          if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            toast.info("Koneksi terputus, menyambung ulang…");
            if (channel) supabase.removeChannel(channel);
            reconnectRef.current = setTimeout(subscribe, 2000);
          }
        });
    };
    subscribe();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user]);

  if (!room) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="font-display text-foreground/60">Memuat ruangan…</p>
      </div>
    );
  }

  const isHost = room.host_id === user?.id;
  const me = players.find((p) => p.user_id === user?.id);
  const allReady = players.every((p) => p.user_id === room.host_id || p.is_ready);
  const canStart = players.length >= 2 && allReady;

  async function copyCode() {
    if (!room) return;
    await navigator.clipboard.writeText(room.room_code);
    toast.success("Kode disalin! 📋");
  }

  async function toggleReady() {
    if (!me) return;
    await supabase
      .from("room_players")
      .update({ is_ready: !me.is_ready })
      .eq("id", me.id);
  }

  async function handleStart() {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("start-game", {
        body: { roomId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memulai");
    } finally {
      setStarting(false);
    }
  }

  async function handleLeave() {
    if (!user || !me) {
      navigate({ to: "/lobby" });
      return;
    }
    await supabase.from("room_players").delete().eq("id", me.id);

    if (isHost) {
      const others = players
        .filter((p) => p.user_id !== user.id)
        .sort((a, b) => (a.joined_at ?? "").localeCompare(b.joined_at ?? ""));
      if (others.length > 0) {
        await supabase
          .from("game_rooms")
          .update({ host_id: others[0].user_id })
          .eq("id", roomId);
      } else {
        await supabase.from("game_rooms").delete().eq("id", roomId);
      }
    }
    navigate({ to: "/lobby" });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Header */}
        <div className="rounded-3xl border-2 border-foreground/10 bg-card p-6 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">
            Kode Ruangan
          </p>
          <button
            onClick={copyCode}
            className="mt-2 font-mono text-5xl font-bold tracking-[0.4em] text-primary"
          >
            {room.room_code}
          </button>
          <p className="mt-2 text-xs text-foreground/50">Klik untuk salin 📋</p>
        </div>

        {/* Players */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">👥 Pemain</h2>
            <span className="text-sm text-foreground/60">
              {players.length}/{room.max_players} Pemain
            </span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-foreground/10 bg-card p-4"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-2xl">
                  {avatarFor(p.username)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold">
                    {p.username}
                    {p.user_id === user?.id && (
                      <span className="ml-1 text-xs text-foreground/50">(kamu)</span>
                    )}
                  </p>
                  {p.user_id === room.host_id ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      👑 HOST
                    </span>
                  ) : p.is_ready ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Siap ✅
                    </span>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                      Belum Siap ⏳
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Rules */}
        <section className="mt-6">
          <button
            onClick={() => setShowRules((s) => !s)}
            className="w-full rounded-2xl border-2 border-dashed border-foreground/15 bg-card/60 px-4 py-3 text-left text-sm font-bold"
          >
            📖 Cara Main {showRules ? "▲" : "▼"}
          </button>
          {showRules && (
            <div className="mt-2 space-y-2 rounded-2xl border-2 border-foreground/10 bg-card p-4 text-sm text-foreground/70">
              <p>1. Kartu dibagi rata. Pasangan langsung dibuang otomatis.</p>
              <p>2. Setiap giliran, ambil 1 kartu dari pemain berikutnya.</p>
              <p>3. Pasangan baru langsung dibuang. Yang habis kartunya = aman.</p>
              <p>4. Pemegang kartu Setan terakhir = kalah! 😈</p>
            </div>
          )}
        </section>

        {/* Actions */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            onClick={handleLeave}
            variant="outline"
            className="h-12 rounded-2xl border-2 font-bold"
          >
            Keluar Ruangan
          </Button>
          {isHost ? (
            <Button
              onClick={handleStart}
              disabled={!canStart || starting}
              className="h-12 rounded-2xl px-7 font-bold"
            >
              {starting
                ? "Memulai…"
                : !canStart
                  ? players.length < 2
                    ? "Min. 2 pemain"
                    : "Tunggu semua siap"
                  : "Mulai Permainan! 🎮"}
            </Button>
          ) : (
            <Button
              onClick={toggleReady}
              className="h-12 rounded-2xl px-7 font-bold"
            >
              {me?.is_ready ? "Batal Siap" : "Siap ✅"}
            </Button>
          )}
        </section>

        <div className="mt-4 text-center">
          <Link to="/lobby" className="text-xs text-foreground/50 underline">
            ← Kembali ke Lobby
          </Link>
        </div>
      </main>
    </div>
  );
}
