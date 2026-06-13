
CREATE TABLE public.playback_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID,
  position_seconds REAL NOT NULL DEFAULT 0,
  queue_song_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  queue_index INTEGER NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  device_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.playback_state TO authenticated;
GRANT ALL ON public.playback_state TO service_role;

ALTER TABLE public.playback_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own playback state"
  ON public.playback_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playback state"
  ON public.playback_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playback state"
  ON public.playback_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playback state"
  ON public.playback_state FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_playback_state_updated_at
  BEFORE UPDATE ON public.playback_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.playback_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playback_state;
