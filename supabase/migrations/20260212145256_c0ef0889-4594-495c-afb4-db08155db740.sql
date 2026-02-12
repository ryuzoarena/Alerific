
-- Create songs table
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Unknown Artist',
  album TEXT,
  duration DOUBLE PRECISION NOT NULL DEFAULT 0,
  audio_path TEXT NOT NULL,
  cover_path TEXT,
  lyrics TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Anyone can read songs
CREATE POLICY "Anyone can read songs"
ON public.songs FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert songs
CREATE POLICY "Anyone can insert songs"
ON public.songs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can delete songs
CREATE POLICY "Anyone can delete songs"
ON public.songs FOR DELETE
TO anon, authenticated
USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true);

-- Storage policies for audio-files
CREATE POLICY "Anyone can read audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

CREATE POLICY "Anyone can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Anyone can delete audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-files');

-- Storage policies for cover-images
CREATE POLICY "Anyone can read cover images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-images');

CREATE POLICY "Anyone can upload cover images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cover-images');

CREATE POLICY "Anyone can delete cover images"
ON storage.objects FOR DELETE
USING (bucket_id = 'cover-images');
