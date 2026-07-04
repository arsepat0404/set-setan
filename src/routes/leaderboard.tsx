import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { avatarFor } from "@/lib/game-logic";

export const Route = createFileRoute("/leaderboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leaderboard — Jajan Terus" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaderboardPage,
});

type Row = {
  user_id: string;
  username: string | null;
  games_played: number;
  games_safe: number;
  times_setan: number;
  avg_rank: number | null;
  win_rate: number | null;
};

function LeaderboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"week" | "all">("all");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function fetchRows() {
    if (tab === "all") {
      const { data } = await supabase
        .from("leaderboard_summary")
        .select("*")
        .order("win_rate", { ascending: false, nullsFirst: false })
        .limit(50);
      setRows((data ?? []) as Row[]);
    } else {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data: entries } = await supabase
        .from("leaderboard_entries")
        .select("user_id, rank, was_setan, finished_at")
        .gte("finished_at", sevenDaysAgo);
      const map = new Map<string, { played: number; safe: number; setan: number; rankSum: number; wins: number }>();
      for (const e of entries ?? []) {
        if (!e.user_id) continue;
        const key = e.user_id;
        const m = map.get(key) ?? { played: 0, safe: 0, setan: 0, rankSum: 0, wins: 0 };
        m.played += 1;
        m.rankSum += e.rank;
        if (e.was_setan) m.setan += 1;
        else m.safe += 1;
        if (e.rank === 1) m.wins += 1;
        map.set(key, m);
      }
      const ids = Array.from(map.keys());
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, username").in("id", ids)
        : { data: [] };
      const names: Record<string, string | null> = {};
      for (const p of profs ?? []) names[p.id] = p.username;
      const computed: Row[] = ids.map((uid) => {
        const m = map.get(uid)!;
        return {
          user_id: uid,
          username: names[uid] ?? "Pemain",
          games_played: m.played,
          games_safe: m.safe,
          times_setan: m.setan,
          avg_rank: Math.round((m.rankSum / m.played) * 10) / 10,
          win_rate: Math.round((m.wins / m.played) * 1000) / 10,
        };
      });
      computed.sort((a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0));
      setRows(computed);
    }
  }

  useEffect(() => {
    fetchRows();
    const id = setInterval(fetchRows, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function rankBadge(i: number) {
    return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/lobby" className="text-sm font-bold text-foreground/60 hover:text-foreground">
            ← Kembali
          </Link>
          <h1 className="font-display text-2xl font-bold">🏆 Leaderboard</h1>
          <span />
        </div>

        <div className="mb-4 flex gap-2">
          {(["week", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-10 rounded-2xl border-2 px-4 text-sm font-bold transition-colors ${
                tab === t ? "border-primary bg-primary text-primary-foreground" : "border-foreground/10 bg-card"
              }`}
            >
              {t === "week" ? "Minggu Ini" : "Sepanjang Waktu"}
            </button>
          ))}
        </div>

        {rows === null ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-foreground/15 bg-card p-10 text-center">
            <p className="text-5xl">🍜</p>
            <h2 className="mt-3 font-display text-xl font-bold">Belum ada pemain nih!</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Yuk mulai main dan jadi yang pertama di papan skor!
            </p>
            <Button
              onClick={() => navigate({ to: "/lobby" })}
              className="mt-4 h-11 rounded-2xl font-bold"
            >
              Main Sekarang
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-3xl border-2 border-foreground/10 bg-card sm:block">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-display">#</th>
                    <th className="px-4 py-3 font-display">Username</th>
                    <th className="px-4 py-3 font-display">Main</th>
                    <th className="px-4 py-3 font-display">Aman</th>
                    <th className="px-4 py-3 font-display">Kena Setan</th>
                    <th className="px-4 py-3 font-display">Win %</th>
                    <th className="px-4 py-3 font-display">Avg Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const mine = r.user_id === user?.id;
                    return (
                      <tr
                        key={r.user_id}
                        className={`border-t border-foreground/10 ${mine ? "bg-secondary/30" : ""}`}
                      >
                        <td className="px-4 py-3 font-bold">{rankBadge(i)}</td>
                        <td className="px-4 py-3">
                          <span className="mr-1">{avatarFor(r.username)}</span>
                          {r.username}{" "}
                          {mine && <span className="ml-1 text-xs text-primary">(Kamu)</span>}
                        </td>
                        <td className="px-4 py-3">{r.games_played}</td>
                        <td className="px-4 py-3">{r.games_safe}</td>
                        <td className="px-4 py-3">{r.times_setan}</td>
                        <td className="px-4 py-3">{r.win_rate ?? 0}%</td>
                        <td className="px-4 py-3">{r.avg_rank ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-2 sm:hidden">
              {rows.map((r, i) => {
                const mine = r.user_id === user?.id;
                return (
                  <li
                    key={r.user_id}
                    className={`rounded-2xl border-2 p-4 ${
                      mine ? "border-primary/30 bg-secondary/30" : "border-foreground/10 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{rankBadge(i)}</span>
                      <span className="text-2xl">{avatarFor(r.username)}</span>
                      <div className="flex-1">
                        <p className="font-display font-bold">
                          {r.username} {mine && <span className="ml-1 text-xs text-primary">(Kamu)</span>}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {r.games_played} main · {r.win_rate ?? 0}% win
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-foreground/70">
                      <span>Aman: {r.games_safe}</span>
                      <span>Setan: {r.times_setan}</span>
                      <span>Avg: {r.avg_rank ?? "-"}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
