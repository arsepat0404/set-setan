CREATE OR REPLACE VIEW public.leaderboard_summary AS
SELECT
  le.user_id,
  p.username,
  COUNT(*) AS games_played,
  COUNT(*) FILTER (WHERE NOT le.was_setan) AS games_safe,
  COUNT(*) FILTER (WHERE le.was_setan) AS times_setan,
  ROUND(AVG(le.rank), 1) AS avg_rank,
  ROUND(COUNT(*) FILTER (WHERE le.rank = 1)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS win_rate
FROM public.leaderboard_entries le
JOIN public.profiles p ON p.id = le.user_id
GROUP BY le.user_id, p.username;

GRANT SELECT ON public.leaderboard_summary TO authenticated;