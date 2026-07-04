
CREATE TYPE public.room_status AS ENUM ('waiting','playing','finished');

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  host_nickname text NOT NULL,
  status public.room_status NOT NULL DEFAULT 'waiting',
  max_players smallint NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 2 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rooms_status_created_idx ON public.rooms (status, created_at DESC);

GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms are publicly readable" ON public.rooms FOR SELECT USING (true);

CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  player_token uuid NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, nickname),
  UNIQUE (room_id, player_token)
);

CREATE INDEX room_players_room_idx ON public.room_players (room_id, joined_at);

GRANT SELECT ON public.room_players TO anon, authenticated;
GRANT ALL ON public.room_players TO service_role;

ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room players publicly readable" ON public.room_players FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER rooms_touch_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
