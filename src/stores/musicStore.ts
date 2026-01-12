import { create } from 'zustand';
import { Song, Playlist, PlayerState, LyricLine } from '@/types/music';

interface MusicStore {
  // Songs
  songs: Song[];
  addSong: (song: Song) => void;
  removeSong: (id: string) => void;
  
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
}

// Demo songs with placeholder lyrics
const demoSongs: Song[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'Synthwave Artist',
    album: 'Night Drive',
    duration: 203,
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    addedAt: Date.now(),
    lyrics: [
      { time: 0, text: "♪ Instrumental intro ♪" },
      { time: 12, text: "Driving through the city lights" },
      { time: 18, text: "Neon signs illuminate the night" },
      { time: 24, text: "Music fills my soul tonight" },
      { time: 30, text: "Everything feels so right" },
      { time: 36, text: "Under the stars we shine" },
      { time: 42, text: "This moment is yours and mine" },
      { time: 48, text: "Dancing through the dreams" },
      { time: 54, text: "Nothing is what it seems" },
      { time: 60, text: "♪ Synth solo ♪" },
    ]
  },
  {
    id: '2',
    title: 'Ocean Waves',
    artist: 'Chill Beats',
    album: 'Summer Vibes',
    duration: 203,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    addedAt: Date.now() - 1000,
    lyrics: [
      { time: 0, text: "♪ Waves crashing ♪" },
      { time: 8, text: "Walking on the sandy shore" },
      { time: 14, text: "Ocean breeze forevermore" },
      { time: 20, text: "Sunset paints the sky" },
      { time: 26, text: "Seagulls flying high" },
      { time: 32, text: "Peace in every moment" },
    ]
  },
  {
    id: '3',
    title: 'Midnight Jazz',
    artist: 'Smooth Ensemble',
    album: 'Late Night Sessions',
    duration: 215,
    coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=300&fit=crop',
    addedAt: Date.now() - 2000,
    lyrics: [
      { time: 0, text: "♪ Piano melody ♪" },
      { time: 10, text: "Smoky room, dim lights glow" },
      { time: 18, text: "Saxophone starts to flow" },
      { time: 26, text: "Notes dancing in the air" },
      { time: 34, text: "Music beyond compare" },
    ]
  },
  {
    id: '4',
    title: 'Summer Groove',
    artist: 'Funk Masters',
    album: 'Good Times',
    duration: 198,
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
    addedAt: Date.now() - 3000,
    lyrics: [
      { time: 0, text: "♪ Funky bass line ♪" },
      { time: 8, text: "Get up and dance tonight" },
      { time: 14, text: "Everything's gonna be alright" },
      { time: 20, text: "Feel the rhythm in your soul" },
    ]
  },
  {
    id: '5',
    title: 'Electric Dreams',
    artist: 'Retro Wave',
    album: 'Future Past',
    duration: 137,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    addedAt: Date.now() - 4000,
    lyrics: [
      { time: 0, text: "♪ Synth arpeggio ♪" },
      { time: 8, text: "Electric dreams tonight" },
      { time: 14, text: "Future shining bright" },
    ]
  },
  {
    id: '6',
    title: 'Chill Session',
    artist: 'Lo-Fi Collective',
    album: 'Study Beats',
    duration: 141,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    addedAt: Date.now() - 5000,
    lyrics: [
      { time: 0, text: "♪ Lo-fi beat starts ♪" },
      { time: 6, text: "Rainy day, coffee warm" },
      { time: 12, text: "Cozy vibes, away from storm" },
    ]
  },
];

const demoPlaylists: Playlist[] = [
  {
    id: 'liked',
    name: 'Liked Songs',
    description: 'Songs you\'ve liked',
    songIds: ['1', '2', '3'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'chill',
    name: 'Chill Vibes',
    description: 'Relaxing tunes for any mood',
    songIds: ['4', '5', '6'],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
  },
];

export const useMusicStore = create<MusicStore>((set, get) => ({
  songs: demoSongs,
  playlists: demoPlaylists,
  
  addSong: (song) => set((state) => ({ songs: [...state.songs, song] })),
  
  removeSong: (id) => set((state) => ({
    songs: state.songs.filter(s => s.id !== id),
    playlists: state.playlists.map(p => ({
      ...p,
      songIds: p.songIds.filter(sid => sid !== id)
    }))
  })),
  
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
    const { queue, queueIndex, playerState } = get();
    if (queue.length === 0) return;
    
    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (playerState.repeat === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }
    
    set({
      queueIndex: nextIndex,
      playerState: {
        ...playerState,
        currentSong: queue[nextIndex],
        currentTime: 0,
        isPlaying: true,
      },
      currentLyricIndex: 0,
    });
  },
  
  prevSong: () => {
    const { queue, queueIndex, playerState } = get();
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
    
    set({
      queueIndex: prevIndex,
      playerState: {
        ...playerState,
        currentSong: queue[prevIndex],
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
}));
