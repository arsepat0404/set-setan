
-- Move find_room_by_code into private schema
DROP FUNCTION IF EXISTS public.find_room_by_code(text);
CREATE OR REPLACE FUNCTION private.find_room_by_code(_room_code text)
RETURNS TABLE(id uuid, room_code text, host_id uuid, status text, max_players integer, timer_seconds integer, player_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.room_code, r.host_id, r.status, r.max_players, r.timer_seconds,
    (SELECT count(*) FROM public.room_players rp WHERE rp.room_id = r.id) AS player_count
  FROM public.game_rooms r
  WHERE r.room_code = upper(trim(_room_code))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private.find_room_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.find_room_by_code(text) TO service_role;

-- Drop the previous get_hand_counts helper; opponent counts now come from game_actions.action_data
DROP FUNCTION IF EXISTS public.get_hand_counts(uuid);

-- Drop legacy view (no longer used; view is security_invoker so authenticated only sees own row anyway)
DROP VIEW IF EXISTS public.player_hand_counts;

-- Revoke leftover anon execute on generate_room_code (it's SECURITY INVOKER but keep it authenticated-only)
REVOKE EXECUTE ON FUNCTION public.generate_room_code() FROM anon;
