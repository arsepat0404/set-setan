import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { ALL_CARDS, type CardType } from "@/data/cards";
import { avatarFor, getTargetForTurn } from "@/lib/game-logic";

export const Route = createFileRoute("/play/$roomId")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Main — Ruangan ${params.roomId.slice(0, 8)}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlayPage,
});

type GameStateRow = {
  id: string;
  room_id: string;
  phase: string;
  turn_order: string[];
  current_turn_user_id: string | null;
  turn_started_at: string | null;
  cards_remaining: number | null;
};

type HandCount = { user_id: string; card_count: number; is_safe: boolean };
type Profile = { id: string; username: string | null };
type RankEntry = { user_id: string; rank: number; was_setan: boolean };

type State = {
  gameState: GameStateRow | null;
  myHand: CardType[];
  opponentCounts: Record<string, HandCount>;
  players: Record<string, Profile>;
  rankings: RankEntry[];
  timerSeconds: number;
};

type Action =
  | { type: "SET_GAME_STATE"; gs: GameStateRow }
  | { type: "SET_MY_HAND"; hand: CardType[] }
  | { type: "SET_COUNTS"; counts: HandCount[] }
  | { type: "SET_PLAYERS"; players: Record<string, Profile> }
  | { type: "SET_RANKINGS"; rankings: RankEntry[] }
  | { type: "SET_TIMER"; seconds: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_GAME_STATE":
      return { ...state, gameState: action.gs };
    case "SET_MY_HAND":
      return { ...state, myHand: action.hand };
    case "SET_COUNTS": {
      const counts: Record<string, HandCount> = {};
      for (const c of action.counts) counts[c.user_id] = c;
      return { ...state, opponentCounts: counts };
    }
    case "SET_PLAYERS":
      return { ...state, players: action.players };
    case "SET_RANKINGS":
      return { ...state, rankings: action.rankings };
    case "SET_TIMER":
      return { ...state, timerSeconds: action.seconds };
    default:
      return state;
  }
}

const initialState: State = {
  gameState: null,
  myHand: [],
  opponentCounts: {},
  players: {},
  rankings: [],
  timerSeconds: 15,
};

type ConnStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

function PlayPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [drawing, setDrawing] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [conn, setConn] = useState<ConnStatus>("connecting");
  const [accessChecked, setAccessChecked] = useState(false);
  const lastWarnRef = useRef(0);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  // Access check: player must belong to this room, otherwise bounce to lobby.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("room_players")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Gagal memverifikasi akses ruangan");
        navigate({ to: "/lobby" });
        return;
      }
      if (!data) {
        toast.error("Kamu tidak berada di ruangan ini 🚫");
        navigate({ to: "/lobby" });
        return;
      }
      setAccessChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, roomId, navigate]);

  // tick clock for timer ring
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  async function refetchAll() {
    if (!user) return;
    const { data: gs } = await supabase
      .from("game_states")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();
    if (!gs) return;
    dispatch({ type: "SET_GAME_STATE", gs: gs as GameStateRow });

    const { data: room } = await supabase
      .from("game_rooms")
      .select("timer_seconds")
      .eq("id", roomId)
      .maybeSingle();
    if (room) dispatch({ type: "SET_TIMER", seconds: room.timer_seconds });

    const { data: myHand } = await supabase
      .from("player_hands")
      .select("cards")
      .eq("game_state_id", (gs as GameStateRow).id)
      .eq("user_id", user.id)
      .maybeSingle();
    dispatch({ type: "SET_MY_HAND", hand: ((myHand?.cards ?? []) as CardType[]) });

    // Opponent card counts (privacy-safe): read the latest game action snapshot.
    const { data: latestAction } = await supabase
      .from("game_actions")
      .select("action_data")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const cc =
      (latestAction?.action_data as {
        card_counts?: Record<string, { card_count: number; is_safe: boolean }>;
      } | null)?.card_counts ?? {};
    const counts: HandCount[] = Object.entries(cc).map(([user_id, v]) => ({
      user_id,
      card_count: v.card_count,
      is_safe: v.is_safe,
    }));
    dispatch({ type: "SET_COUNTS", counts });

    const ids = (gs as GameStateRow).turn_order;
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ids);
    const playersMap: Record<string, Profile> = {};
    for (const p of profs ?? []) playersMap[p.id] = p as Profile;
    dispatch({ type: "SET_PLAYERS", players: playersMap });

    if ((gs as GameStateRow).phase === "finished") {
      const { data: ranks } = await supabase
        .from("leaderboard_entries")
        .select("user_id, rank, was_setan")
        .eq("room_id", roomId)
        .order("rank", { ascending: true });
      dispatch({ type: "SET_RANKINGS", rankings: (ranks ?? []) as RankEntry[] });
    }
  }

  // Initial fetch + realtime with auto-reconnect (exponential backoff, capped).
  useEffect(() => {
    if (!user || !accessChecked) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    refetchAll();

    const cleanupChannel = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const subscribe = () => {
      if (cancelled) return;
      setConn(attemptRef.current === 0 ? "connecting" : "reconnecting");
      channel = supabase
        .channel(`game:${roomId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "game_states", filter: `room_id=eq.${roomId}` },
          () => refetchAll(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "player_hands" },
          () => refetchAll(),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "game_actions", filter: `room_id=eq.${roomId}` },
          (payload) => {
            const data = (payload.new as { action_data?: { matched?: boolean } } | null)
              ?.action_data;
            if (data?.matched) toast.success("Cocok! Pasangan dibuang 🎉");
            refetchAll();
          },
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            attemptRef.current = 0;
            setConn("connected");
            // Full refetch on reconnect to catch missed events.
            refetchAll();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConn(status === "CLOSED" ? "disconnected" : "reconnecting");
            cleanupChannel();
            const delay = Math.min(1000 * 2 ** attemptRef.current, 15000);
            attemptRef.current += 1;
            if (attemptRef.current === 2) {
              toast.info("Koneksi terputus, mencoba sambung ulang… 🔄");
            }
            reconnectRef.current = setTimeout(subscribe, delay);
          }
        });
    };
    subscribe();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      cleanupChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user, accessChecked]);

  const isMyTurn = state.gameState?.current_turn_user_id === user?.id;

  // Polling timer-tick
  useEffect(() => {
    if (!isMyTurn || state.gameState?.phase !== "playing") return;
    const id = setInterval(() => {
      supabase.functions.invoke("timer-tick", { body: { roomId } }).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [isMyTurn, state.gameState?.phase, roomId]);

  const safeSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of Object.values(state.opponentCounts)) if (c.is_safe) s.add(c.user_id);
    return s;
  }, [state.opponentCounts]);

  const currentTarget = useMemo(() => {
    if (!state.gameState?.current_turn_user_id) return null;
    return getTargetForTurn(
      state.gameState.turn_order,
      state.gameState.current_turn_user_id,
      safeSet,
    );
  }, [state.gameState, safeSet]);

  const elapsedRatio = useMemo(() => {
    if (!state.gameState?.turn_started_at) return 0;
    const started = new Date(state.gameState.turn_started_at).getTime();
    const e = (now - started) / 1000 / state.timerSeconds;
    return Math.max(0, Math.min(1, e));
  }, [now, state.gameState?.turn_started_at, state.timerSeconds]);

  const timerColor =
    elapsedRatio < 0.5 ? "stroke-emerald-500" : elapsedRatio < 0.8 ? "stroke-amber-500" : "stroke-destructive";

  async function handleDraw(cardIndex: number) {
    if (drawing !== null) return;
    if (!isMyTurn) {
      const t = Date.now();
      if (t - lastWarnRef.current > 2000) {
        toast.info("Tunggu giliranmu ya! 😄");
        lastWarnRef.current = t;
      }
      return;
    }
    setDrawing(cardIndex);
    try {
      const { data, error } = await supabase.functions.invoke("draw-card", {
        body: { roomId, cardIndex },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal ambil kartu");
    } finally {
      setDrawing(null);
    }
  }

  if (!state.gameState) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="font-display text-foreground/60">Menyiapkan meja…</p>
      </div>
    );
  }

  const opponentIds = state.gameState.turn_order.filter((id) => id !== user?.id);
  const activePlayerId = state.gameState.current_turn_user_id;
  const targetCount = currentTarget ? state.opponentCounts[currentTarget]?.card_count ?? 0 : 0;
  const phase = state.gameState.phase;

  const connMeta =
    conn === "connected"
      ? { label: "Terhubung", dot: "bg-emerald-500", ring: "" }
      : conn === "connecting"
        ? { label: "Menyambungkan…", dot: "bg-amber-500", ring: "animate-pulse" }
        : conn === "reconnecting"
          ? { label: "Mencoba ulang…", dot: "bg-amber-500", ring: "animate-pulse" }
          : { label: "Terputus", dot: "bg-destructive", ring: "animate-pulse" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
        {/* Connection status */}
        <div
          role="status"
          aria-live="polite"
          className={`mb-3 inline-flex w-fit items-center gap-2 self-end rounded-full border border-foreground/10 bg-card px-3 py-1 text-xs font-bold shadow-sm ${connMeta.ring}`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${connMeta.dot}`} />
          {connMeta.label}
        </div>

        {/* Opponents */}
        <section className="flex flex-wrap justify-center gap-3">
          {opponentIds.map((id) => {
            const isActive = id === activePlayerId;
            const isTarget = id === currentTarget;
            const c = state.opponentCounts[id];
            const safe = c?.is_safe;
            return (
              <div
                key={id}
                className={`relative flex flex-col items-center rounded-2xl border-2 bg-card p-3 transition-all ${
                  isTarget
                    ? "border-primary shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                    : "border-foreground/10"
                } ${safe ? "opacity-50" : ""}`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-2xl ${
                    isActive ? "ring-4 ring-amber-400 ring-offset-2" : ""
                  }`}
                >
                  {avatarFor(state.players[id]?.username)}
                </span>
                <p className="mt-1 max-w-[80px] truncate text-xs font-bold">
                  {state.players[id]?.username ?? "Pemain"}
                </p>
                <p className="text-[10px] font-bold text-foreground/60">
                  {c?.card_count ?? 0} kartu
                </p>
                {safe && (
                  <span className="text-[10px] font-bold text-emerald-600">AMAN ✅</span>
                )}
                {isTarget && (
                  <span className="absolute -bottom-5 whitespace-nowrap text-[10px] font-bold text-primary">
                    ← Ambil dari sini
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* Center: status + timer */}
        <section className="my-8 flex flex-col items-center" aria-live="polite">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="44" className="fill-none stroke-foreground/10" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`fill-none transition-all ${timerColor} ${elapsedRatio > 0.8 ? "animate-pulse" : ""}`}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * elapsedRatio}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center font-display text-lg font-bold">
              {Math.max(0, Math.ceil(state.timerSeconds * (1 - elapsedRatio)))}s
            </div>
          </div>
          <p className="mt-3 text-center font-display text-base font-bold">
            {phase === "finished"
              ? "Game Selesai!"
              : isMyTurn
                ? `Giliran Kamu! Ambil kartu dari ${state.players[currentTarget ?? ""]?.username ?? "lawan"} 🎯`
                : `Giliran ${state.players[activePlayerId ?? ""]?.username ?? "…"} … mengambil dari ${state.players[currentTarget ?? ""]?.username ?? "…"}`}
          </p>
        </section>

        {/* Target cards (face-down) when my turn */}
        {isMyTurn && currentTarget && phase === "playing" && (
          <section className="mb-8">
            <p className="mb-2 text-center text-sm font-bold text-foreground/70">
              Pilih kartu dari {state.players[currentTarget]?.username ?? "lawan"}:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: targetCount }).map((_, i) => (
                <GameCard
                  key={i}
                  isFaceDown
                  isLoading={drawing === i}
                  disabled={drawing !== null}
                  onClick={() => handleDraw(i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* My hand */}
        <section className="mt-auto">
          <p className="mb-2 text-sm font-bold text-foreground/70">
            Kartumu ({state.myHand.length}):
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <AnimatePresence>
              {state.myHand.map((c, i) => (
                <motion.div
                  key={`${c.id}-${i}`}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <GameCard card={c} />
                </motion.div>
              ))}
            </AnimatePresence>
            {state.myHand.length === 0 && (
              <p className="text-sm text-emerald-600">🎉 Kartumu habis — kamu aman!</p>
            )}
          </div>
        </section>
      </main>

      {/* Finished overlay */}
      {phase === "finished" && (
        <div
          aria-live="assertive"
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur"
        >
          <div className="mx-4 w-full max-w-md rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-2xl">
            <h2 className="text-center font-display text-3xl font-bold">Game Selesai! 🎊</h2>
            <ul className="mt-5 space-y-2">
              {state.rankings.map((r) => {
                const badge =
                  r.rank === 1 ? "🏆 Aman ke-1" : r.was_setan ? "😈 Kena Setan!" : `🥈 Aman ke-${r.rank}`;
                return (
                  <li
                    key={r.user_id}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
                      r.was_setan
                        ? "animate-pulse border-destructive/30 bg-destructive/10"
                        : "border-foreground/10"
                    }`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-xl">
                      {avatarFor(state.players[r.user_id]?.username)}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`font-display font-bold ${
                          r.was_setan ? "text-destructive" : ""
                        }`}
                      >
                        #{r.rank} {state.players[r.user_id]?.username ?? "Pemain"}
                      </p>
                      <p className="text-xs font-bold text-foreground/60">{badge}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => navigate({ to: "/lobby" })}
                variant="outline"
                className="h-11 rounded-2xl border-2 font-bold"
              >
                Kembali ke Lobby
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suppress unused */}
      <span hidden>{ALL_CARDS.length}</span>
    </div>
  );
}
