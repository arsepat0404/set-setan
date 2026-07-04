
-- Drop old tables from previous phase
DROP TABLE IF EXISTS public.room_players CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TYPE IF EXISTS room_status CASCADE;

-- ENUMS
CREATE TYPE room_status AS ENUM ('waiting', 'playing', 'finished');
CREATE TYPE game_phase AS ENUM ('lobby', 'distributing', 'playing', 'finished');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 20),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- game_rooms
CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  host_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  max_players int NOT NULL DEFAULT 5 CHECK (max_players BETWEEN 2 AND 5),
  timer_seconds int NOT NULL DEFAULT 15 CHECK (timer_seconds BETWEEN 10 AND 60),
  status room_status NOT NULL DEFAULT 'waiting',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.game_rooms TO authenticated;
GRANT ALL ON public.game_rooms TO service_role;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON public.game_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms_insert" ON public.game_rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_update" ON public.game_rooms FOR UPDATE TO authenticated USING (host_id = auth.uid());

-- room_players
CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_ready boolean NOT NULL DEFAULT false,
  player_order int,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO authenticated;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select" ON public.room_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "rp_insert" ON public.room_players FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rp_update" ON public.room_players FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rp_delete" ON public.room_players FOR DELETE TO authenticated USING (user_id = auth.uid());

-- game_states
CREATE TABLE public.game_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid UNIQUE NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  current_turn_user_id uuid REFERENCES auth.users(id),
  turn_order uuid[] NOT NULL DEFAULT '{}',
  phase game_phase NOT NULL DEFAULT 'lobby',
  turn_started_at timestamptz,
  cards_remaining int NOT NULL DEFAULT 51,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.game_states TO authenticated;
GRANT ALL ON public.game_states TO service_role;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

-- can_access_game_state function (needed before policy)
CREATE OR REPLACE FUNCTION public.can_access_game_state(_user_id uuid, _game_state_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_players rp
    JOIN public.game_states gs ON gs.room_id = rp.room_id
    WHERE rp.user_id = _user_id AND gs.id = _game_state_id
  );
$$;

CREATE POLICY "gs_select" ON public.game_states FOR SELECT TO authenticated
  USING (public.can_access_game_state(auth.uid(), id));

-- player_hands
CREATE TABLE public.player_hands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id uuid NOT NULL REFERENCES public.game_states(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  cards jsonb NOT NULL DEFAULT '[]',
  card_count int NOT NULL DEFAULT 0,
  is_safe boolean NOT NULL DEFAULT false,
  safe_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_state_id, user_id)
);
GRANT SELECT ON public.player_hands TO authenticated;
GRANT ALL ON public.player_hands TO service_role;
ALTER TABLE public.player_hands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ph_select_self" ON public.player_hands FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- game_actions
CREATE TABLE public.game_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  action_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.game_actions TO authenticated;
GRANT ALL ON public.game_actions TO service_role;
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ga_select" ON public.game_actions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.room_players rp
    WHERE rp.room_id = game_actions.room_id AND rp.user_id = auth.uid()
  ));

-- edge_rate_limits (no RLS, service only)
CREATE TABLE public.edge_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 1,
  UNIQUE(user_id, action, window_start)
);
GRANT ALL ON public.edge_rate_limits TO service_role;

-- leaderboard_entries
CREATE TABLE public.leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  finished_at timestamptz DEFAULT now(),
  rank int NOT NULL,
  was_setan boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.leaderboard_entries TO authenticated;
GRANT ALL ON public.leaderboard_entries TO service_role;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_select" ON public.leaderboard_entries FOR SELECT TO authenticated USING (true);

-- VIEW
CREATE VIEW public.player_hand_counts AS
  SELECT game_state_id, user_id, card_count, is_safe
  FROM public.player_hands;
GRANT SELECT ON public.player_hand_counts TO authenticated;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'Pemain_' || substring(NEW.id::text, 1, 6))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _user_id uuid, _action text, _limit int, _window_seconds int
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _window timestamptz := date_trunc('minute', now());
  _count int;
BEGIN
  DELETE FROM public.edge_rate_limits
  WHERE window_start < now() - interval '6 hours';
  INSERT INTO public.edge_rate_limits (user_id, action, window_start, count)
  VALUES (_user_id, _action, _window, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = edge_rate_limits.count + 1;
  SELECT count INTO _count FROM public.edge_rate_limits
  WHERE user_id = _user_id AND action = _action AND window_start = _window;
  RETURN _count <= _limit;
END; $$;

-- TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_rooms_updated_at BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_states_updated_at BEFORE UPDATE ON public.game_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_player_hands_updated_at BEFORE UPDATE ON public.player_hands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_hands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_actions;
