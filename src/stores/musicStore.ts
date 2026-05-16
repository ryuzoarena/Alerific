import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, Playlist, PlayerState } from '@/types/music';
import { supabase } from '@/integrations/supabase/client';
import { getAudioUrl, getCoverUrl, getPlaylistCoverUrl, deleteAudioFromCloud, deleteCoverFromCloud, uploadPlaylistCover, deletePlaylistCoverFromCloud } from '@/lib/cloudStorage';


interface MusicStore {
  // Songs
  songs: Song[];
  songsLoaded: boolean;
  fetchSongs: () => Promise<void>;
  addSong: (song: Song) => void;
  removeSong: (id: string) => void;
  
  // Recently Played (max 3, ordered by most recent)
  recentlyPlayedIds: string[];
  addToRecentlyPlayed: (songId: string) => void;
  
  // Daily Recommendations (resets at 3 AM)
  dailyRecommendationIds: string[];
  lastRecommendationReset: number;
  refreshDailyRecommendations: () => void;
  checkAndRefreshRecommendations: () => void;
  
  // Playlists
  playlists: Playlist[];
  playlistsLoaded: boolean;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string, coverBlob?: Blob) => Promise<Playlist | null>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  addSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  setPlaylistVisibility: (playlistId: string, isPublic: boolean) => Promise<void>;
  updatePlaylistCover: (playlistId: string, blob: Blob) => Promise<void>;
  savePlaylistToLibrary: (playlistId: string) => Promise<void>;
  unsavePlaylistFromLibrary: (playlistId: string) => Promise<void>;
  previewPublicPlaylist: (playlistId: string) => Promise<void>;
  
  // User Queue (manual queue - plays before auto queue)
  userQueue: Song[];
  addToUserQueue: (song: Song) => void;
  removeFromUserQueue: (index: number) => void;
  clearUserQueue: () => void;
  reorderUserQueue: (fromIndex: number, toIndex: number) => void;
  showQueuePanel: boolean;
  setShowQueuePanel: (show: boolean) => void;
  
  // Player
  playerState: PlayerState;
  queue: Song[];
  queueIndex: number;
  shuffledQueue: Song[];
  shuffledIndex: number;
  
  // Player actions
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Lyrics
  showLyrics: boolean;
  setShowLyrics: (show: boolean) => void;
  currentLyricIndex: number;
  setCurrentLyricIndex: (index: number) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Mobile sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const defaultPlaylists: Playlist[] = [
  {
    id: 'liked',
    name: 'Liked Songs',
    description: 'Songs you\'ve liked',
    songIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Helper to check if we need to reset (past 3 AM today)
const shouldResetRecommendations = (lastReset: number): boolean => {
  const now = new Date();
  const today3AM = new Date(now);
  today3AM.setHours(3, 0, 0, 0);
  if (now.getHours() < 3) {
    today3AM.setDate(today3AM.getDate() - 1);
  }
  return lastReset < today3AM.getTime();
};

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const buildFairShuffleQueue = (all: Song[], current: Song | null): Song[] => {
  if (all.length === 0) return [];
  if (!current) return shuffleArray([...all]);
  const rest = all.filter((s) => s.id !== current.id);
  return [current, ...shuffleArray(rest)];
};

// Convert a DB row to a Song with public URLs
const dbRowToSong = (row: any): Song => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  album: row.album || undefined,
  duration: row.duration,
  audio_path: row.audio_path,
  cover_path: row.cover_path || undefined,
  audioUrl: row.audio_path ? getAudioUrl(row.audio_path) : undefined,
  coverUrl: row.cover_path ? getCoverUrl(row.cover_path) : undefined,
  lyrics: row.lyrics ? JSON.parse(row.lyrics) : [],
  addedAt: new Date(row.created_at).getTime(),
});

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      songs: [],
      songsLoaded: false,
      playlists: defaultPlaylists,
      playlistsLoaded: false,
      recentlyPlayedIds: [],
      dailyRecommendationIds: [],
      lastRecommendationReset: 0,
      userQueue: [],
      showQueuePanel: false,

      fetchPlaylists: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const uid = user?.id;

          // Owned playlists
          const ownedRes = await supabase
            .from('playlists')
            .select('*, playlist_songs(song_id, position)')
            .order('created_at', { ascending: false });
          if (ownedRes.error) throw ownedRes.error;

          // Saved playlists (only if logged in)
          let savedRows: any[] = [];
          if (uid) {
            const savedRes = await supabase
              .from('saved_playlists')
              .select('playlist_id, playlists!inner(*, playlist_songs(song_id, position))')
              .eq('user_id', uid);
            if (!savedRes.error) savedRows = savedRes.data || [];
          }

          const rowToPlaylist = (row: any, isSaved = false): Playlist => {
            const songs = (row.playlist_songs || [])
              .slice()
              .sort((a: any, b: any) => a.position - b.position);
            return {
              id: row.id,
              name: row.name,
              description: row.description || undefined,
              cover_path: row.cover_path || undefined,
              coverUrl: row.cover_path ? getPlaylistCoverUrl(row.cover_path) : undefined,
              songIds: songs.map((s: any) => s.song_id),
              createdAt: new Date(row.created_at).getTime(),
              updatedAt: new Date(row.updated_at).getTime(),
              owner_id: row.owner_id,
              owner_username: row.owner_username || undefined,
              is_public: row.is_public,
              isSaved,
            };
          };

          const owned = (ownedRes.data || [])
            .filter((r: any) => !uid || r.owner_id === uid) // RLS already filters, defensive
            .map((r: any) => rowToPlaylist(r, false));
          const saved = savedRows.map((s: any) => rowToPlaylist(s.playlists, true));

          // Keep local "Liked Songs" + DB playlists, dedupe saved
          set((state) => {
            const liked = state.playlists.find((p) => p.id === 'liked') || defaultPlaylists[0];
            const ownedIds = new Set(owned.map((p) => p.id));
            const dedupedSaved = saved.filter((p) => !ownedIds.has(p.id));
            return {
              playlists: [liked, ...owned, ...dedupedSaved],
              playlistsLoaded: true,
            };
          });
        } catch (err) {
          console.error('Error fetching playlists:', err);
          set({ playlistsLoaded: true });
        }
      },


      fetchSongs: async () => {
        try {
          const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          const songs = (data || []).map(dbRowToSong);
          set({ songs, songsLoaded: true });
        } catch (error) {
          console.error('Error fetching songs:', error);
          set({ songsLoaded: true });
        }
      },
      
      addToRecentlyPlayed: (songId: string) => {
        set((state) => {
          const filtered = state.recentlyPlayedIds.filter(id => id !== songId);
          return { recentlyPlayedIds: [songId, ...filtered].slice(0, 3) };
        });
      },
      
      refreshDailyRecommendations: () => {
        const { songs } = get();
        const shuffledIds = shuffleArray(songs.map(s => s.id)).slice(0, 6);
        set({
          dailyRecommendationIds: shuffledIds,
          lastRecommendationReset: Date.now(),
        });
      },
      
      checkAndRefreshRecommendations: () => {
        const { lastRecommendationReset, songs, dailyRecommendationIds } = get();
        if (shouldResetRecommendations(lastRecommendationReset) || 
            (songs.length > 0 && dailyRecommendationIds.length === 0)) {
          get().refreshDailyRecommendations();
        }
      },
      
      addSong: (song) => {
        set((state) => ({ songs: [song, ...state.songs] }));
      },
      
      removeSong: async (id) => {
        const song = get().songs.find(s => s.id === id);
        
        // Delete from cloud storage
        if (song?.audio_path) {
          await deleteAudioFromCloud(song.audio_path).catch(console.error);
        }
        if (song?.cover_path) {
          await deleteCoverFromCloud(song.cover_path).catch(console.error);
        }
        
        // Delete from database
        await supabase.from('songs').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Error deleting song from DB:', error);
        });
        
        set((state) => ({
          songs: state.songs.filter(s => s.id !== id),
          playlists: state.playlists.map(p => ({
            ...p,
            songIds: p.songIds.filter(sid => sid !== id)
          }))
        }));
      },

      // User Queue actions
      addToUserQueue: (song) => set((state) => ({ userQueue: [...state.userQueue, song] })),
      removeFromUserQueue: (index) => set((state) => ({
        userQueue: state.userQueue.filter((_, i) => i !== index),
      })),
      clearUserQueue: () => set({ userQueue: [] }),
      reorderUserQueue: (fromIndex, toIndex) => set((state) => {
        const newQueue = [...state.userQueue];
        const [moved] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, moved);
        return { userQueue: newQueue };
      }),
      setShowQueuePanel: (show) => set({ showQueuePanel: show }),
      
      createPlaylist: async (name, description, coverBlob) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('Must be logged in to create playlist');
            return null;
          }

          // Fetch display name for owner_username denormalisation
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .single();
          const owner_username = prof?.display_name || user.email?.split('@')[0] || 'user';

          const { data, error } = await supabase
            .from('playlists')
            .insert({
              owner_id: user.id,
              owner_username,
              name,
              description: description || null,
            })
            .select()
            .single();
          if (error) throw error;

          let cover_path: string | undefined;
          let coverUrl: string | undefined;
          if (coverBlob) {
            try {
              cover_path = await uploadPlaylistCover(user.id, data.id, coverBlob);
              await supabase.from('playlists').update({ cover_path }).eq('id', data.id);
              coverUrl = getPlaylistCoverUrl(cover_path);
            } catch (e) {
              console.error('Cover upload failed:', e);
            }
          }

          const playlist: Playlist = {
            id: data.id,
            name: data.name,
            description: data.description || undefined,
            cover_path,
            coverUrl,
            songIds: [],
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
            owner_id: data.owner_id,
            owner_username: data.owner_username,
            is_public: data.is_public,
          };
          set((state) => ({ playlists: [...state.playlists, playlist] }));
          return playlist;
        } catch (err) {
          console.error('Error creating playlist:', err);
          return null;
        }
      },

      deletePlaylist: async (id) => {
        // Local-only playlist (e.g. "liked")
        if (id === 'liked') {
          set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
          return;
        }
        const playlist = get().playlists.find((p) => p.id === id);
        if (playlist?.cover_path) {
          await deletePlaylistCoverFromCloud(playlist.cover_path).catch(console.error);
        }
        const { error } = await supabase.from('playlists').delete().eq('id', id);
        if (error) console.error('Error deleting playlist:', error);
        set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
      },

      addSongToPlaylist: async (playlistId, songId) => {
        await get().addSongsToPlaylist(playlistId, [songId]);
      },

      addSongsToPlaylist: async (playlistId, songIds) => {
        const playlist = get().playlists.find((p) => p.id === playlistId);
        if (!playlist) return;
        const existing = new Set(playlist.songIds);
        const newIds = songIds.filter((id) => !existing.has(id));
        if (newIds.length === 0) return;

        if (playlistId !== 'liked' && !playlist.isSaved) {
          const startPos = playlist.songIds.length;
          const rows = newIds.map((sid, i) => ({
            playlist_id: playlistId,
            song_id: sid,
            position: startPos + i,
          }));
          const { error } = await supabase.from('playlist_songs').insert(rows);
          if (error) {
            console.error('Error adding songs to playlist:', error);
            return;
          }
        }

        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songIds: [...p.songIds, ...newIds], updatedAt: Date.now() }
              : p,
          ),
        }));
      },

      removeSongFromPlaylist: async (playlistId, songId) => {
        if (playlistId !== 'liked') {
          const { error } = await supabase
            .from('playlist_songs')
            .delete()
            .eq('playlist_id', playlistId)
            .eq('song_id', songId);
          if (error) console.error('Error removing song from playlist:', error);
        }
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songIds: p.songIds.filter((id) => id !== songId), updatedAt: Date.now() }
              : p,
          ),
        }));
      },

      setPlaylistVisibility: async (playlistId, isPublic) => {
        const { error } = await supabase
          .from('playlists')
          .update({ is_public: isPublic })
          .eq('id', playlistId);
        if (error) {
          console.error('Error updating visibility:', error);
          return;
        }
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, is_public: isPublic } : p,
          ),
        }));
      },

      updatePlaylistCover: async (playlistId, blob) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
          const cover_path = await uploadPlaylistCover(user.id, playlistId, blob);
          await supabase.from('playlists').update({ cover_path }).eq('id', playlistId);
          const coverUrl = `${getPlaylistCoverUrl(cover_path)}?t=${Date.now()}`;
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === playlistId ? { ...p, cover_path, coverUrl } : p,
            ),
          }));
        } catch (e) {
          console.error('Cover update failed:', e);
        }
      },

      savePlaylistToLibrary: async (playlistId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
          .from('saved_playlists')
          .insert({ user_id: user.id, playlist_id: playlistId });
        if (error && error.code !== '23505') {
          console.error('Error saving playlist:', error);
          return;
        }
        await get().fetchPlaylists();
      },

      unsavePlaylistFromLibrary: async (playlistId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
          .from('saved_playlists')
          .delete()
          .eq('user_id', user.id)
          .eq('playlist_id', playlistId);
        if (error) {
          console.error('Error unsaving playlist:', error);
          return;
        }
        set((state) => ({
          playlists: state.playlists.filter((p) => !(p.id === playlistId && p.isSaved)),
        }));
      },

      previewPublicPlaylist: async (playlistId) => {
        if (get().playlists.some((p) => p.id === playlistId)) return;
        const { data, error } = await supabase
          .from('playlists')
          .select('*, playlist_songs(song_id, position)')
          .eq('id', playlistId)
          .single();
        if (error || !data) {
          console.error('Cannot load public playlist:', error);
          return;
        }
        const songsOrdered = (data.playlist_songs || [])
          .slice()
          .sort((a: any, b: any) => a.position - b.position);
        const playlist: Playlist = {
          id: data.id,
          name: data.name,
          description: data.description || undefined,
          cover_path: data.cover_path || undefined,
          coverUrl: data.cover_path ? getPlaylistCoverUrl(data.cover_path) : undefined,
          songIds: songsOrdered.map((s: any) => s.song_id),
          createdAt: new Date(data.created_at).getTime(),
          updatedAt: new Date(data.updated_at).getTime(),
          owner_id: data.owner_id,
          owner_username: data.owner_username || undefined,
          is_public: data.is_public,
          isSaved: false,
        };
        set((state) => ({ playlists: [...state.playlists, playlist] }));
      },
        currentSong: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.7,
        isMuted: false,
        shuffle: false,
        repeat: 'off',
      },
      
      queue: [],
      queueIndex: 0,
      shuffledQueue: [],
      shuffledIndex: 0,
      
      playSong: (song, queue) => {
        const state = get();
        const newQueue = queue || state.songs;
        const index = newQueue.findIndex(s => s.id === song.id);
        state.addToRecentlyPlayed(song.id);
        const availableQueue = newQueue.length > 0 ? newQueue : state.songs;
        const nextShuffledQueue = state.playerState.shuffle
          ? buildFairShuffleQueue(availableQueue, song)
          : state.shuffledQueue;

        set({
          playerState: {
            ...state.playerState,
            currentSong: song,
            isPlaying: true,
            currentTime: 0,
          },
          queue: newQueue,
          queueIndex: index >= 0 ? index : 0,
          shuffledQueue: state.playerState.shuffle ? nextShuffledQueue : [],
          shuffledIndex: state.playerState.shuffle ? 0 : 0,
          currentLyricIndex: 0,
        });
      },
      
      togglePlay: () => set((state) => ({
        playerState: {
          ...state.playerState,
          isPlaying: !state.playerState.isPlaying,
        }
      })),
      
      nextSong: () => {
        const { queue, queueIndex, playerState, songs, addToRecentlyPlayed, shuffledQueue, shuffledIndex, userQueue } = get();
        
        // If there are songs in the user queue, play the first one
        if (userQueue.length > 0) {
          const nextFromUserQueue = userQueue[0];
          addToRecentlyPlayed(nextFromUserQueue.id);
          set({
            userQueue: userQueue.slice(1),
            playerState: {
              ...playerState,
              currentSong: nextFromUserQueue,
              currentTime: 0,
              isPlaying: true,
            },
            currentLyricIndex: 0,
          });
          return;
        }
        
        const availableQueue = queue.length > 0 ? queue : songs;
        if (availableQueue.length === 0) return;

        const current = playerState.currentSong;
        let activeShuffleQueue = shuffledQueue;
        let activeShuffleIndex = shuffledIndex;
        
        if (playerState.shuffle) {
          const expectedId = current?.id;
          const foundIndex = expectedId ? activeShuffleQueue.findIndex((s) => s.id === expectedId) : -1;
          if (activeShuffleQueue.length === 0 || foundIndex === -1) {
            activeShuffleQueue = buildFairShuffleQueue(availableQueue, current);
            activeShuffleIndex = 0;
          } else {
            activeShuffleIndex = foundIndex;
          }
        }

        let nextSong: Song;
        let newQueueIndex: number;
        let newShuffledIndex = activeShuffleIndex;
        let newShuffledQueue = activeShuffleQueue;

        if (playerState.shuffle) {
          newShuffledIndex = activeShuffleIndex + 1;
          if (newShuffledIndex >= newShuffledQueue.length) {
            newShuffledQueue = shuffleArray([...availableQueue]);
            if (current && newShuffledQueue.length > 1 && newShuffledQueue[0].id === current.id) {
              newShuffledQueue = [...newShuffledQueue.slice(1), newShuffledQueue[0]];
            }
            newShuffledIndex = 0;
          }
          nextSong = newShuffledQueue[newShuffledIndex];
          newQueueIndex = availableQueue.findIndex((s) => s.id === nextSong.id);
          if (newQueueIndex === -1) newQueueIndex = 0;
        } else {
          newQueueIndex = queueIndex + 1;
          if (newQueueIndex >= availableQueue.length) {
            if (playerState.repeat === 'all') {
              newQueueIndex = 0;
            } else {
              return;
            }
          }
          nextSong = availableQueue[newQueueIndex];
        }

        addToRecentlyPlayed(nextSong.id);
        set({
          queueIndex: newQueueIndex,
          queue: availableQueue,
          shuffledQueue: playerState.shuffle ? newShuffledQueue : [],
          shuffledIndex: playerState.shuffle ? newShuffledIndex : 0,
          playerState: {
            ...playerState,
            currentSong: nextSong,
            currentTime: 0,
            isPlaying: true,
          },
          currentLyricIndex: 0,
        });
      },
      
      prevSong: () => {
        const { queue, queueIndex, playerState, addToRecentlyPlayed } = get();
        if (queue.length === 0) return;
        if (playerState.currentTime > 3) {
          set({ playerState: { ...playerState, currentTime: 0 }, currentLyricIndex: 0 });
          return;
        }
        let prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = playerState.repeat === 'all' ? queue.length - 1 : 0;
        }
        const prevSongItem = queue[prevIndex];
        addToRecentlyPlayed(prevSongItem.id);
        set({
          queueIndex: prevIndex,
          playerState: { ...playerState, currentSong: prevSongItem, currentTime: 0, isPlaying: true },
          currentLyricIndex: 0,
        });
      },
      
      setCurrentTime: (time) => set((state) => ({
        playerState: { ...state.playerState, currentTime: time }
      })),
      setDuration: (duration) => set((state) => ({
        playerState: { ...state.playerState, duration }
      })),
      setVolume: (volume) => set((state) => ({
        playerState: { ...state.playerState, volume, isMuted: volume === 0 }
      })),
      toggleMute: () => set((state) => ({
        playerState: { ...state.playerState, isMuted: !state.playerState.isMuted }
      })),
      
      toggleShuffle: () => {
        const state = get();
        const newShuffle = !state.playerState.shuffle;
        if (newShuffle) {
          const availableQueue = state.queue.length > 0 ? state.queue : state.songs;
          const shuffled = buildFairShuffleQueue(availableQueue, state.playerState.currentSong);
          set({ playerState: { ...state.playerState, shuffle: true }, shuffledQueue: shuffled, shuffledIndex: 0 });
        } else {
          set({ playerState: { ...state.playerState, shuffle: false }, shuffledQueue: [], shuffledIndex: 0 });
        }
      },
      
      toggleRepeat: () => set((state) => {
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(state.playerState.repeat);
        return { playerState: { ...state.playerState, repeat: modes[(currentIndex + 1) % modes.length] } };
      }),
      
      showLyrics: false,
      setShowLyrics: (show) => set({ showLyrics: show }),
      currentLyricIndex: 0,
      setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
      
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
    }),
    {
      name: 'sybau-music-storage',
      partialize: (state) => ({
        // Persist only the local "Liked Songs" playlist; the rest come from DB.
        playlists: state.playlists.filter((p) => p.id === 'liked'),
        recentlyPlayedIds: state.recentlyPlayedIds,
        dailyRecommendationIds: state.dailyRecommendationIds,
        lastRecommendationReset: state.lastRecommendationReset,
      }),
    }
  )
);
