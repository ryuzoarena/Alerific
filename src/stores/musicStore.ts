import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, Playlist, PlayerState } from '@/types/music';
import { supabase } from '@/integrations/supabase/client';
import { getAudioUrl, getCoverUrl, deleteAudioFromCloud, deleteCoverFromCloud } from '@/lib/cloudStorage';

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
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  
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
      recentlyPlayedIds: [],
      dailyRecommendationIds: [],
      lastRecommendationReset: 0,

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
      
      createPlaylist: (name, description) => {
        const playlist: Playlist = {
          id: crypto.randomUUID(),
          name,
          description,
          songIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ playlists: [...state.playlists, playlist] }));
        return playlist;
      },
      
      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),
      
      addSongToPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId && !p.songIds.includes(songId)
            ? { ...p, songIds: [...p.songIds, songId], updatedAt: Date.now() }
            : p
        )
      })),
      
      removeSongFromPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId
            ? { ...p, songIds: p.songIds.filter(id => id !== songId), updatedAt: Date.now() }
            : p
        )
      })),
      
      playerState: {
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
        const { queue, queueIndex, playerState, songs, addToRecentlyPlayed, shuffledQueue, shuffledIndex } = get();
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
        playlists: state.playlists,
        recentlyPlayedIds: state.recentlyPlayedIds,
        dailyRecommendationIds: state.dailyRecommendationIds,
        lastRecommendationReset: state.lastRecommendationReset,
      }),
    }
  )
);
