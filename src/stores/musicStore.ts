import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, Playlist, PlayerState } from '@/types/music';
import { getAudioFile, getCoverImage, deleteAudioFile, deleteCoverImage, initDB } from '@/lib/storage';

interface MusicStore {
  // Songs
  songs: Song[];
  addSong: (song: Song) => void;
  removeSong: (id: string) => void;
  loadSongMedia: (songId: string) => Promise<{ audioUrl: string; coverUrl?: string } | null>;
  
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
  
  // Player
  playerState: PlayerState;
  queue: Song[];
  queueIndex: number;
  
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

// Initialize the IndexedDB on load
initDB().catch(console.error);

// Helper to check if we need to reset (past 3 AM today)
const shouldResetRecommendations = (lastReset: number): boolean => {
  const now = new Date();
  const today3AM = new Date(now);
  today3AM.setHours(3, 0, 0, 0);
  
  // If current time is before 3 AM, use yesterday's 3 AM
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

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      songs: [],
      playlists: defaultPlaylists,
      recentlyPlayedIds: [],
      dailyRecommendationIds: [],
      lastRecommendationReset: 0,
      
      addToRecentlyPlayed: (songId: string) => {
        set((state) => {
          // Remove if exists, add to front, keep max 3
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
        
        // Also refresh if we have songs but no recommendations
        if (shouldResetRecommendations(lastRecommendationReset) || 
            (songs.length > 0 && dailyRecommendationIds.length === 0)) {
          get().refreshDailyRecommendations();
        }
      },
      
      addSong: (song) => {
        // Don't persist audioUrl and coverUrl (they're blob URLs that expire)
        const songToStore = { ...song, audioUrl: undefined, coverUrl: undefined };
        set((state) => ({ songs: [...state.songs, songToStore] }));
      },
      
      removeSong: async (id) => {
        // Delete from IndexedDB
        await deleteAudioFile(id).catch(console.error);
        await deleteCoverImage(id).catch(console.error);
        
        set((state) => ({
          songs: state.songs.filter(s => s.id !== id),
          playlists: state.playlists.map(p => ({
            ...p,
            songIds: p.songIds.filter(sid => sid !== id)
          }))
        }));
      },
      
      loadSongMedia: async (songId: string) => {
        try {
          const audioBlob = await getAudioFile(songId);
          if (!audioBlob) return null;
          
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const coverBlob = await getCoverImage(songId);
          const coverUrl = coverBlob ? URL.createObjectURL(coverBlob) : undefined;
          
          return { audioUrl, coverUrl };
        } catch (error) {
          console.error('Error loading song media:', error);
          return null;
        }
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
      
      playSong: (song, queue) => {
        const newQueue = queue || get().songs;
        const index = newQueue.findIndex(s => s.id === song.id);
        
        // Add to recently played
        get().addToRecentlyPlayed(song.id);
        
        set({
          playerState: {
            ...get().playerState,
            currentSong: song,
            isPlaying: true,
            currentTime: 0,
          },
          queue: newQueue,
          queueIndex: index >= 0 ? index : 0,
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
        const { queue, queueIndex, playerState, songs, addToRecentlyPlayed } = get();
        const availableQueue = queue.length > 0 ? queue : songs;
        if (availableQueue.length === 0) return;
        
        let nextIndex: number;
        
        if (playerState.shuffle) {
          // Pick a random song different from current
          const randomIndex = Math.floor(Math.random() * availableQueue.length);
          nextIndex = randomIndex === queueIndex && availableQueue.length > 1 
            ? (randomIndex + 1) % availableQueue.length 
            : randomIndex;
        } else {
          nextIndex = queueIndex + 1;
          if (nextIndex >= availableQueue.length) {
            if (playerState.repeat === 'all') {
              nextIndex = 0;
            } else {
              return;
            }
          }
        }
        
        const nextSong = availableQueue[nextIndex];
        
        // Add next song to recently played
        addToRecentlyPlayed(nextSong.id);
        
        set({
          queueIndex: nextIndex,
          queue: availableQueue,
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
        
        // If more than 3 seconds in, restart song
        if (playerState.currentTime > 3) {
          set({
            playerState: { ...playerState, currentTime: 0 },
            currentLyricIndex: 0,
          });
          return;
        }
        
        let prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = playerState.repeat === 'all' ? queue.length - 1 : 0;
        }
        
        const prevSongItem = queue[prevIndex];
        
        // Add previous song to recently played
        addToRecentlyPlayed(prevSongItem.id);
        
        set({
          queueIndex: prevIndex,
          playerState: {
            ...playerState,
            currentSong: prevSongItem,
            currentTime: 0,
            isPlaying: true,
          },
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
        playerState: {
          ...state.playerState,
          isMuted: !state.playerState.isMuted,
        }
      })),
      
      toggleShuffle: () => set((state) => ({
        playerState: {
          ...state.playerState,
          shuffle: !state.playerState.shuffle,
        }
      })),
      
      toggleRepeat: () => set((state) => {
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(state.playerState.repeat);
        const nextIndex = (currentIndex + 1) % modes.length;
        return {
          playerState: {
            ...state.playerState,
            repeat: modes[nextIndex],
          }
        };
      }),
      
      showLyrics: false,
      setShowLyrics: (show) => set({ showLyrics: show }),
      currentLyricIndex: 0,
      setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
      
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Mobile sidebar
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
    }),
    {
      name: 'sybau-music-storage',
      partialize: (state) => ({
        songs: state.songs,
        playlists: state.playlists,
        recentlyPlayedIds: state.recentlyPlayedIds,
        dailyRecommendationIds: state.dailyRecommendationIds,
        lastRecommendationReset: state.lastRecommendationReset,
      }),
    }
  )
);
