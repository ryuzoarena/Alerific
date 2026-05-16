import { supabase } from '@/integrations/supabase/client';

const AUDIO_BUCKET = 'audio-files';
const COVER_BUCKET = 'cover-images';
const PLAYLIST_COVER_BUCKET = 'playlist-covers';

export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const getAudioUrl = (path: string): string => getPublicUrl(AUDIO_BUCKET, path);
export const getCoverUrl = (path: string): string => getPublicUrl(COVER_BUCKET, path);
export const getPlaylistCoverUrl = (path: string): string => getPublicUrl(PLAYLIST_COVER_BUCKET, path);

/** Upload a playlist cover (already a Blob, usually compressed JPEG). */
export const uploadPlaylistCover = async (
  ownerId: string,
  playlistId: string,
  blob: Blob,
): Promise<string> => {
  const path = `${ownerId}/${playlistId}.jpg`;
  const { error } = await supabase.storage
    .from(PLAYLIST_COVER_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
};

export const deletePlaylistCoverFromCloud = async (path: string): Promise<void> => {
  await supabase.storage.from(PLAYLIST_COVER_BUCKET).remove([path]);
};


export const uploadAudioFile = async (songId: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'mp3';
  const path = `${songId}.${ext}`;
  
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, { 
      upsert: true,
      contentType: file.type || 'audio/mpeg',
    });
  
  if (error) throw error;
  return path;
};

export const uploadCoverImage = async (songId: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${songId}.${ext}`;
  
  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, { 
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
  
  if (error) throw error;
  return path;
};

export const deleteAudioFromCloud = async (path: string): Promise<void> => {
  await supabase.storage.from(AUDIO_BUCKET).remove([path]);
};

export const deleteCoverFromCloud = async (path: string): Promise<void> => {
  await supabase.storage.from(COVER_BUCKET).remove([path]);
};
