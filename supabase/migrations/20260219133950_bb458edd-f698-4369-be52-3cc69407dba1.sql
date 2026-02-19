
-- Fix 1: Restrict songs table write access to authenticated users only
DROP POLICY "Anyone can insert songs" ON public.songs;
DROP POLICY "Anyone can delete songs" ON public.songs;

CREATE POLICY "Authenticated users can insert songs"
ON public.songs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete songs"
ON public.songs FOR DELETE
TO authenticated
USING (true);

-- Fix 2: Restrict storage bucket write access to authenticated users only
DROP POLICY IF EXISTS "Anyone can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload cover images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete cover images" ON storage.objects;

CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Authenticated users can delete audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files');

CREATE POLICY "Authenticated users can upload cover images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cover-images');

CREATE POLICY "Authenticated users can delete cover images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cover-images');
