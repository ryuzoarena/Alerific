
-- =========================================
-- PLAYLISTS SCHEMA
-- =========================================

CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  owner_username text,
  name text NOT NULL,
  description text,
  cover_path text,
  is_public boolean NOT NULL DEFAULT false,
  play_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.playlist_songs (
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, song_id)
);

CREATE TABLE public.saved_playlists (
  user_id uuid NOT NULL,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, playlist_id)
);

CREATE INDEX idx_playlists_owner ON public.playlists(owner_id);
CREATE INDEX idx_playlists_public ON public.playlists(is_public) WHERE is_public = true;
CREATE INDEX idx_playlist_songs_playlist ON public.playlist_songs(playlist_id, position);
CREATE INDEX idx_saved_playlists_user ON public.saved_playlists(user_id);

-- Updated_at trigger
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- RLS
-- =========================================

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_playlists ENABLE ROW LEVEL SECURITY;

-- playlists: read if public, or owner, or saved by user
CREATE POLICY "Read public or owned or saved playlists"
ON public.playlists
FOR SELECT
TO anon, authenticated
USING (
  is_public = true
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.saved_playlists sp
    WHERE sp.playlist_id = playlists.id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Owner can insert playlists"
ON public.playlists
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update playlists"
ON public.playlists
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete playlists"
ON public.playlists
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- playlist_songs: visibility mirrors parent
CREATE POLICY "Read playlist songs if playlist visible"
ON public.playlist_songs
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_songs.playlist_id
      AND (
        p.is_public = true
        OR p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.saved_playlists sp
          WHERE sp.playlist_id = p.id AND sp.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Owner can insert playlist songs"
ON public.playlist_songs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_songs.playlist_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can delete playlist songs"
ON public.playlist_songs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_songs.playlist_id AND p.owner_id = auth.uid()
  )
);

-- saved_playlists: user owns their saves
CREATE POLICY "Users read own saves"
ON public.saved_playlists
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users add own saves"
ON public.saved_playlists
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own saves"
ON public.saved_playlists
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =========================================
-- STORAGE BUCKET: playlist-covers
-- =========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('playlist-covers', 'playlist-covers', true);

CREATE POLICY "Public read playlist covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated can upload own playlist covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'playlist-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated can update own playlist covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'playlist-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated can delete own playlist covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'playlist-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
