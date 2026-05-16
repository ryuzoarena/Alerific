export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  coverUrl?: string;
  audioUrl?: string;
  // Cloud storage paths
  audio_path?: string;
  cover_path?: string;
  lyrics?: LyricLine[];
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  cover_path?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
  // DB-backed fields (undefined for local-only playlists like "Liked Songs")
  owner_id?: string;
  owner_username?: string;
  is_public?: boolean;
  isSaved?: boolean; // true when saved from another user
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
}
