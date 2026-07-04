
-- 1. Enable RLS on edge_rate_limits (no policies -> only service_role bypasses)
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Private schema for SECURITY DEFINER helpers not exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 3. Helper functions in private schema
CREATE OR REPLACE FUNCTION private.is_room_participant(_user_id uuid, _room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_players WHERE room_id = _room_id AND user_id = _user_id
  );
$$;
REVOKE ALL ON FUNCTION private.is_room_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_room_participant(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.shares_room(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a = _b OR EXISTS (
    SELECT 1 FROM public.room_players r1
    JOIN public.room_players r2 ON r1.room_id = r2.room_id
    WHERE r1.user_id = _a AND r2.user_id = _b
  );
$$;
REVOKE ALL ON FUNCTION private.shares_room(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.shares_room(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.shared_leaderboard(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a = _b OR EXISTS (
    SELECT 1 FROM public.leaderboard_entries le1
    JOIN public.leaderboard_entries le2 ON le1.room_id = le2.room_id
    WHERE le1.user_id = _a AND le2.user_id = _b
  );
$$;
REVOKE ALL ON FUNCTION private.shared_leaderboard(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.shared_leaderboard(uuid, uuid) TO authenticated, service_role;

-- 4. Move can_access_game_state into private schema
DROP POLICY IF EXISTS gs_select ON public.game_states;
DROP FUNCTION IF EXISTS public.can_access_game_state(uuid, uuid);

CREATE OR REPLACE FUNCTION private.can_access_game_state(_user_id uuid, _game_state_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_players rp
    JOIN public.game_states gs ON gs.room_id = rp.room_id
    WHERE rp.user_id = _user_id AND gs.id = _game_state_id
  );
$$;
REVOKE ALL ON FUNCTION private.can_access_game_state(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_access_game_state(uuid, uuid) TO authenticated, service_role;

CREATE POLICY gs_select ON public.game_states
  FOR SELECT TO authenticated
  USING (private.can_access_game_state(auth.uid(), id));

-- 5. consume_rate_limit: keep in public but restrict EXECUTE to service_role only
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) TO service_role;

-- 6. Trigger-only functions: revoke all execute from callers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;

-- 7. generate_room_code -> SECURITY INVOKER (only reads game_rooms, authenticated already allowed)
DROP FUNCTION IF EXISTS public.generate_room_code();
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  code_exists boolean;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS (SELECT 1 FROM public.game_rooms WHERE room_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END; $$;
REVOKE ALL ON FUNCTION public.generate_room_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_room_code() TO authenticated, service_role;

-- 8. Recreate views with security_invoker so RLS applies to view queries
DROP VIEW IF EXISTS public.leaderboard_summary;
DROP VIEW IF EXISTS public.player_hand_counts;

CREATE VIEW public.player_hand_counts
  WITH (security_invoker = true) AS
SELECT game_state_id, user_id, card_count, is_safe
FROM public.player_hands;

CREATE VIEW public.leaderboard_summary
  WITH (security_invoker = true) AS
SELECT le.user_id,
  p.username,
  count(*) AS games_played,
  count(*) FILTER (WHERE NOT le.was_setan) AS games_safe,
  count(*) FILTER (WHERE le.was_setan) AS times_setan,
  round(avg(le.rank), 1) AS avg_rank,
  round((count(*) FILTER (WHERE le.rank = 1))::numeric / NULLIF(count(*), 0)::numeric * 100, 1) AS win_rate
FROM public.leaderboard_entries le
JOIN public.profiles p ON p.id = le.user_id
GROUP BY le.user_id, p.username;

GRANT SELECT ON public.player_hand_counts TO authenticated;
GRANT SELECT ON public.leaderboard_summary TO authenticated;

-- 9. Add SELECT policy on player_hands for same-room participants (only exposes counts via view thanks to app usage; direct SELECT of cards column would also match, so we keep this narrow and rely on view projection).
-- To avoid leaking cards, do NOT broaden player_hands SELECT here.
-- Instead: extend the existing self-only policy by adding a policy that only allows non-card columns via a companion view is not possible with column-grained RLS.
-- Trade-off: keep ph_select_self as the only policy. player_hand_counts view (security_invoker) will therefore only show the caller's own row.
-- To preserve gameplay UX (seeing opponents' counts), add a SECURITY DEFINER RPC that returns only safe columns.

CREATE OR REPLACE FUNCTION public.get_hand_counts(_game_state_id uuid)
RETURNS TABLE(user_id uuid, card_count integer, is_safe boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ph.user_id, ph.card_count, ph.is_safe
  FROM public.player_hands ph
  WHERE ph.game_state_id = _game_state_id
    AND private.can_access_game_state(auth.uid(), _game_state_id);
$$;
REVOKE ALL ON FUNCTION public.get_hand_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_hand_counts(uuid) TO authenticated;
-- Note: intentionally left executable by authenticated because it does its own
-- authorization check (private.can_access_game_state) and only exposes counts.

-- 10. Tighten SELECT policies

-- profiles: self OR shares a room OR leaderboard history together
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR private.shares_room(auth.uid(), id)
    OR private.shared_leaderboard(auth.uid(), id)
  );

-- room_players: only rows for rooms you are in
DROP POLICY IF EXISTS rp_select ON public.room_players;
CREATE POLICY rp_select ON public.room_players
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR private.is_room_participant(auth.uid(), room_id)
  );

-- game_rooms: only rooms you participate in (or host)
DROP POLICY IF EXISTS rooms_select ON public.game_rooms;
CREATE POLICY rooms_select ON public.game_rooms
  FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR private.is_room_participant(auth.uid(), id)
  );

-- leaderboard_entries: your own rows OR from rooms you participated in
DROP POLICY IF EXISTS lb_select ON public.leaderboard_entries;
CREATE POLICY lb_select ON public.leaderboard_entries
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR private.is_room_participant(auth.uid(), room_id)
  );

-- 11. Helper to look up joinable room by code (used by join-room edge function via service_role; safe to also expose to authenticated for convenience because room_code IS the join secret)
CREATE OR REPLACE FUNCTION public.find_room_by_code(_room_code text)
RETURNS TABLE(id uuid, room_code text, host_id uuid, status text, max_players integer, timer_seconds integer, player_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.room_code, r.host_id, r.status, r.max_players, r.timer_seconds,
    (SELECT count(*) FROM public.room_players rp WHERE rp.room_id = r.id) AS player_count
  FROM public.game_rooms r
  WHERE r.room_code = upper(trim(_room_code))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.find_room_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_room_by_code(text) TO authenticated, service_role;
