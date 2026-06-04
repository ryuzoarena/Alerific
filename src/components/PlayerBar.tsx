import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Shuffle, Repeat, Repeat1, Mic2, ListMusic, Maximize2, Trash2 
} from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';
import { applyMobilePlaybackSettings, applySafePlaybackSettings, isMobilePlaybackDevice } from '@/lib/audio';
import { FullScreenPlayer } from './FullScreenPlayer';
import { MiniPlayer } from './MiniPlayer';
import { useBackgroundPlayback } from '@/hooks/useBackgroundPlayback';
import { useAudioStabilityGuard } from '@/hooks/useAudioStabilityGuard';
import { useNowPlayingNotification } from '@/hooks/useNowPlayingNotification';
import { useAudioEngine } from '@/hooks/useAudioEngine';

interface PlayerBarProps {
  onToggleLyrics: () => void;
  showLyrics: boolean;
  onCoverUrlChange?: (url: string | null) => void;
}

export function PlayerBar({ onToggleLyrics, showLyrics, onCoverUrlChange }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadAudioRef = useRef<HTMLAudioElement>(null);
  const preloadedUrlRef = useRef<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging] = useState(false);
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string | null>(null);
  const [loadedCoverUrl, setLoadedCoverUrl] = useState<string | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  // Crossfade refs
  const isCrossfadingRef = useRef(false);
  const crossfadeIntervalRef = useRef<number | null>(null);
  const skipNextSrcLoadRef = useRef(false);

  const {
    playerState,
    togglePlay,
    nextSong,
    prevSong,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setCurrentLyricIndex,
    removeSong,
    setShowQueuePanel,
  } = useMusicStore();

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted, shuffle, repeat } = playerState;

  // Web Audio API engine for mono & equalizer
  const resumeAudioContext = useAudioEngine(audioRef);

  // Cancel any in-flight crossfade (used on manual skip / pause)
  const cancelCrossfade = useCallback(() => {
    if (crossfadeIntervalRef.current !== null) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
    if (preloadAudioRef.current) {
      try { preloadAudioRef.current.pause(); } catch { void 0; }
      preloadAudioRef.current.volume = 0;
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    isCrossfadingRef.current = false;
  }, [isMuted, volume]);


  // Load audio from cloud URL when song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audioUrl = currentSong.audioUrl || null;
    const coverUrl = currentSong.coverUrl || null;

    setLoadedCoverUrl(coverUrl);
    onCoverUrlChange?.(coverUrl);

    // If a crossfade just promoted preload → main, do NOT reset src or currentTime
    if (skipNextSrcLoadRef.current) {
      skipNextSrcLoadRef.current = false;
      setLoadedAudioUrl(audioUrl);
      return;
    }

    setLoadedAudioUrl(audioUrl);

    if (audioUrl) {
      if (isMobilePlaybackDevice()) applyMobilePlaybackSettings(audioRef.current);
      else applySafePlaybackSettings(audioRef.current);
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [currentSong, onCoverUrlChange, setCurrentTime]);

  // Setup Media Session API for background playback control (notification bar)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    // Set metadata for the notification bar / lock-screen controls
    if ('MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || 'Alphatus',
        artwork: loadedCoverUrl ? [
          { src: loadedCoverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: loadedCoverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: loadedCoverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: loadedCoverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: loadedCoverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: loadedCoverUrl, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });
    }

    // Set action handlers for media controls
    navigator.mediaSession.setActionHandler('play', () => {
      if (audioRef.current) {
        if (isMobilePlaybackDevice()) applyMobilePlaybackSettings(audioRef.current);
        else applySafePlaybackSettings(audioRef.current);
        audioRef.current.play().catch(() => {});
      }
      resumeAudioContext();
      if (!useMusicStore.getState().playerState.isPlaying) togglePlay();
      navigator.mediaSession.playbackState = 'playing';
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      if (useMusicStore.getState().playerState.isPlaying) togglePlay();
      navigator.mediaSession.playbackState = 'paused';
    });
    
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    // Seek backward/forward handlers for some devices
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        const skipTime = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skipTime);
        setCurrentTime(audioRef.current.currentTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        const skipTime = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + skipTime);
        setCurrentTime(audioRef.current.currentTime);
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
  }, [currentSong, loadedCoverUrl, togglePlay, prevSong, nextSong, setCurrentTime, duration, resumeAudioContext]);

  // Sync playback state with Media Session API (for notification bar)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update position state for seek bar in notification
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (!currentSong || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch (e) {
      // Some browsers may throw if position > duration
      console.warn('Media Session position state error:', e);
    }
  }, [currentTime, duration, currentSong]);

  // Sync audio with player state
  useEffect(() => {
    if (!audioRef.current || !currentSong || !loadedAudioUrl) return;
    
    if (isPlaying) {
      if (isMobilePlaybackDevice()) applyMobilePlaybackSettings(audioRef.current);
      else applySafePlaybackSettings(audioRef.current);
      resumeAudioContext();
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong, loadedAudioUrl, resumeAudioContext]);

  // Background playback support - keeps music playing when screen is off
  useBackgroundPlayback(audioRef, isPlaying, resumeAudioContext);

  // Re-apply safe audio settings on each new src/track lifecycle (fix: only first song stable)
  useAudioStabilityGuard(audioRef, Boolean(currentSong && loadedAudioUrl));

  // Show "Now Playing" notification when song changes
  useNowPlayingNotification(currentSong, loadedCoverUrl, isPlaying);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMobilePlaybackDevice() && (isMuted || volume === 0) ? 0.01 : isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Spacebar to play/pause - global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentSong) {
          togglePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSong, togglePlay]);

  // Helper: get the URL of the next song that will play
  const getNextSongUrl = useCallback((): string | null => {
    const state = useMusicStore.getState();
    const { playerState: ps, queue, queueIndex, songs, userQueue, shuffledQueue, shuffledIndex } = state;
    
    if (ps.repeat === 'one') return ps.currentSong?.audioUrl || null;
    
    // User queue takes priority
    if (userQueue.length > 0) return userQueue[0].audioUrl || null;
    
    const availableQueue = queue.length > 0 ? queue : songs;
    if (availableQueue.length === 0) return null;
    
    if (ps.shuffle && shuffledQueue.length > 0) {
      const nextIdx = shuffledIndex + 1;
      if (nextIdx < shuffledQueue.length) return shuffledQueue[nextIdx].audioUrl || null;
      return null;
    }
    
    let nextIdx = queueIndex + 1;
    if (nextIdx >= availableQueue.length) {
      if (ps.repeat === 'all') nextIdx = 0;
      else return null;
    }
    return availableQueue[nextIdx]?.audioUrl || null;
  }, []);

  // Start a crossfade from main audio → preload audio. When complete, promote
  // the preload track to be the new "current" via nextSong() (without re-loading).
  const startCrossfade = useCallback((fadeSeconds: number) => {
    const main = audioRef.current;
    const next = preloadAudioRef.current;
    if (!main || !next) return;
    if (isCrossfadingRef.current) return;
    if (!preloadedUrlRef.current) return;

    // Clamp fade to remaining time of current song
    const remaining = Math.max(0, main.duration - main.currentTime);
    const safeFade = Math.max(0.5, Math.min(fadeSeconds, remaining));

    isCrossfadingRef.current = true;
    const targetVolume = isMuted ? 0 : volume;

    try {
      next.currentTime = 0;
      next.volume = 0;
      next.play().catch(() => {});
    } catch {/* ignore */}

    const steps = 30;
    const stepMs = (safeFade * 1000) / steps;
    let step = 0;

    crossfadeIntervalRef.current = window.setInterval(() => {
      step++;
      const p = step / steps;
      try {
        if (main) main.volume = Math.max(0, targetVolume * (1 - p));
        if (next) next.volume = Math.min(targetVolume, targetVolume * p);
      } catch {/* ignore */}

      if (step >= steps) {
        if (crossfadeIntervalRef.current !== null) {
          clearInterval(crossfadeIntervalRef.current);
          crossfadeIntervalRef.current = null;
        }

        // Promote preload → main without resetting src/currentTime
        const promotedUrl = preloadedUrlRef.current;
        const continueAt = next.currentTime;
        try { next.pause(); } catch { void 0; }
        next.volume = 0;

        if (promotedUrl && main) {
          try {
            skipNextSrcLoadRef.current = true;
            main.src = promotedUrl;
            // Wait for the new src to be ready before resuming
            const resume = () => {
              try {
                main.currentTime = continueAt;
                main.volume = targetVolume;
                main.play().catch(() => {});
              } catch {/* ignore */}
              main.removeEventListener('loadedmetadata', resume);
            };
            main.addEventListener('loadedmetadata', resume);
            main.load();
          } catch {/* ignore */}
        }

        preloadedUrlRef.current = null;
        isCrossfadingRef.current = false;

        // Advance store state to next track
        useMusicStore.getState().nextSong();
      }
    }, stepMs);
  }, [isMuted, volume]);

  // Time update handler
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);

      const remaining = audioRef.current.duration - audioRef.current.currentTime;

      // Crossfade trigger (real audio fade between songs)
      const crossfadeSeconds = useSettingsStore.getState().crossfadeSeconds;
      const repeatMode = useMusicStore.getState().playerState.repeat;
      if (
        crossfadeSeconds > 0 &&
        remaining > 0 &&
        remaining <= crossfadeSeconds &&
        !isCrossfadingRef.current &&
        repeatMode !== 'one'
      ) {
        // Ensure preload has the next URL
        const nextUrl = getNextSongUrl();
        if (nextUrl) {
          if (preloadedUrlRef.current !== nextUrl && preloadAudioRef.current) {
            preloadedUrlRef.current = nextUrl;
            preloadAudioRef.current.src = nextUrl;
            preloadAudioRef.current.load();
          }
          startCrossfade(crossfadeSeconds);
        }
      } else if (remaining > 0 && remaining <= 5 && preloadAudioRef.current) {
        // Standard preload (gapless / faster swap)
        const nextUrl = getNextSongUrl();
        if (nextUrl && preloadedUrlRef.current !== nextUrl) {
          preloadedUrlRef.current = nextUrl;
          preloadAudioRef.current.src = nextUrl;
          preloadAudioRef.current.load();
        }
      }

      // Update current lyric index
      if (currentSong?.lyrics) {
        const lyrics = currentSong.lyrics;
        let index = 0;
        for (let i = lyrics.length - 1; i >= 0; i--) {
          if (audioRef.current.currentTime >= lyrics[i].time) {
            index = i;
            break;
          }
        }
        setCurrentLyricIndex(index);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Auto-play next song when current ends — use a ref so the handler
  // always reads the latest store / settings state, avoiding stale closures.
  const handleEndedRef = useRef<() => void>(() => {});
  handleEndedRef.current = () => {
    const latestRepeat = useMusicStore.getState().playerState.repeat;
    const latestAutoplay = useSettingsStore.getState().autoplay;
    const latestQueue = useMusicStore.getState().queue;
    const latestSongs = useMusicStore.getState().songs;
    const latestNextSong = useMusicStore.getState().nextSong;

    if (latestRepeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      applySafePlaybackSettings(audioRef.current);
      audioRef.current.play().catch(() => {});
    } else if (latestAutoplay) {
      const availableQueue = latestQueue.length > 0 ? latestQueue : latestSongs;
      if (availableQueue.length > 1 || latestRepeat === 'all') {
        latestNextSong();
        
        const newSong = useMusicStore.getState().playerState.currentSong;
        if (audioRef.current && newSong) {
          const newAudioUrl = newSong.audioUrl || null;
          if (newAudioUrl) {
            applySafePlaybackSettings(audioRef.current);
            audioRef.current.src = newAudioUrl;
            // Skip load() if already preloaded for faster gapless transition
            if (preloadedUrlRef.current !== newAudioUrl) {
              audioRef.current.load();
            }
            audioRef.current.play().catch(() => {});
            preloadedUrlRef.current = null;
            setLoadedAudioUrl(newAudioUrl);
            setLoadedCoverUrl(newSong.coverUrl || null);
            onCoverUrlChange?.(newSong.coverUrl || null);
          }
        }
      }
    }
  };

  const handleEnded = () => handleEndedRef.current();

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDelete = () => {
    if (currentSong) {
      removeSong(currentSong.id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      {/* Hidden preload element for gapless playback */}
      <audio ref={preloadAudioRef} crossOrigin="anonymous" preload="auto" playsInline style={{ display: 'none' }} />

      {/* Mobile Mini Player */}
      <MiniPlayer 
        loadedCoverUrl={loadedCoverUrl}
        onClick={() => setShowFullScreen(true)}
      />

      {/* Full Screen Player */}
      <FullScreenPlayer 
        isOpen={showFullScreen}
        onClose={() => setShowFullScreen(false)}
        loadedCoverUrl={loadedCoverUrl}
        audioRef={audioRef}
      />

      {/* Desktop Player Bar — midnight glass */}
      <footer
        className="hidden lg:flex h-[88px] items-center px-5 gap-5 relative"
        style={{
          background: 'linear-gradient(180deg, #0e1320 0%, #0a0f1a 100%)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* Left - Song info */}
        <div className="w-[26%] min-w-[200px] flex items-center gap-3">
          {currentSong ? (
            <>
              <div
                className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                onClick={() => setShowFullScreen(true)}
                style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}
              >
                {loadedCoverUrl ? (
                  <img src={loadedCoverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1DB954]/40 to-[#1a2035]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate text-white leading-tight">
                  {currentSong.title}
                </p>
                <p className="text-[11px] text-[#8896a4] truncate mt-0.5">
                  {currentSong.artist}
                </p>
              </div>
              <button className="p-1.5 text-[#8896a4] hover:text-[#1DB954] transition-colors" title="Like">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </>
          ) : (
            <div className="text-sm text-[#4a5568]">No song playing</div>
          )}
        </div>

        {/* Center - Controls + inline progress */}
        <div className="flex-1 flex items-center justify-center gap-4 max-w-[760px] mx-auto">
          <button
            onClick={toggleShuffle}
            className={cn(
              "transition-colors",
              shuffle ? "text-[#1DB954]" : "text-[#8896a4] hover:text-white"
            )}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={() => { cancelCrossfade(); prevSong(); }}
            className="text-[#8896a4] hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          {/* Play / Pause — outlined circle */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              border: '1.5px solid rgba(255,255,255,0.5)',
              background: 'transparent',
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={16} className="text-white" fill="currentColor" />
            ) : (
              <Play size={16} className="text-white ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => { cancelCrossfade(); nextSong(); }}
            className="text-[#8896a4] hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            className={cn(
              "transition-colors",
              repeat !== 'off' ? "text-[#1DB954]" : "text-[#8896a4] hover:text-white"
            )}
            title="Repeat"
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>

          {/* Inline progress bar */}
          <div className="flex items-center gap-2 flex-1 ml-3 max-w-[360px]">
            <span className="text-[10px] text-[#4a5568] w-8 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-[3px] rounded-full cursor-pointer group relative"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full relative transition-all"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #1DB954 0%, #17a349 100%)',
                  boxShadow: '0 0 8px rgba(29,185,84,0.5)',
                }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: '#1DB954', boxShadow: '0 0 8px #1DB954' }}
                />
              </div>
            </div>
            <span className="text-[10px] text-[#4a5568] w-8 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right - Extras + Volume */}
        <div className="w-[26%] min-w-[200px] flex items-center justify-end gap-3">
          <button
            onClick={onToggleLyrics}
            className={cn(
              "transition-colors",
              showLyrics ? "text-[#1DB954]" : "text-[#8896a4] hover:text-white"
            )}
            title="Lyrics"
          >
            <Mic2 size={15} />
          </button>

          <button
            onClick={() => setShowQueuePanel(true)}
            className="text-[#8896a4] hover:text-white transition-colors"
            title="Queue"
          >
            <ListMusic size={15} />
          </button>

          {currentSong && (
            <button
              onClick={handleDelete}
              className="text-[#8896a4] hover:text-red-400 transition-colors"
              title="Delete song"
            >
              <Trash2 size={15} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-[#8896a4] hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 rounded-full appearance-none cursor-pointer volume-slider"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
          </div>

          <button
            onClick={() => setShowFullScreen(true)}
            className="text-[#8896a4] hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </footer>

    </>
  );
}
