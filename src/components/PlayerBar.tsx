import { useRef, useEffect, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Shuffle, Repeat, Repeat1, Mic2, ListMusic, Maximize2, Trash2 
} from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';
import { FullScreenPlayer } from './FullScreenPlayer';
import { MiniPlayer } from './MiniPlayer';

interface PlayerBarProps {
  onToggleLyrics: () => void;
  showLyrics: boolean;
  onCoverUrlChange?: (url: string | null) => void;
}

export function PlayerBar({ onToggleLyrics, showLyrics, onCoverUrlChange }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string | null>(null);
  const [loadedCoverUrl, setLoadedCoverUrl] = useState<string | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  
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
    loadSongMedia,
    removeSong,
    songs,
    queue,
    queueIndex,
  } = useMusicStore();

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted, shuffle, repeat } = playerState;

  // Load audio from IndexedDB when song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    
    // Revoke previous URLs to prevent memory leaks
    if (loadedAudioUrl) URL.revokeObjectURL(loadedAudioUrl);
    if (loadedCoverUrl) URL.revokeObjectURL(loadedCoverUrl);
    
    // Load from IndexedDB
    loadSongMedia(currentSong.id).then((media) => {
      if (media && audioRef.current) {
        setLoadedAudioUrl(media.audioUrl);
        setLoadedCoverUrl(media.coverUrl || null);
        onCoverUrlChange?.(media.coverUrl || null);
        audioRef.current.src = media.audioUrl;
        audioRef.current.load();
      }
    });
  }, [currentSong?.id]);

  // Setup Media Session API for background playback control
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || 'Unknown Album',
      artwork: loadedCoverUrl ? [
        { src: loadedCoverUrl, sizes: '512x512', type: 'image/jpeg' }
      ] : []
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      togglePlay();
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      togglePlay();
    });
    
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [currentSong, loadedCoverUrl, togglePlay, prevSong, nextSong, setCurrentTime]);

  // Sync audio with player state
  useEffect(() => {
    if (!audioRef.current || !currentSong || !loadedAudioUrl) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong, loadedAudioUrl]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
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

  // Time update handler
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      
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

  // Auto-play next song when current ends
  const handleEnded = () => {
    if (repeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      // Auto-play next song if available
      const availableQueue = queue.length > 0 ? queue : songs;
      if (availableQueue.length > 1 || repeat === 'all') {
        // Use setTimeout to ensure state updates properly even in background
        setTimeout(() => {
          nextSong();
        }, 0);
      }
    }
  };

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
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

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

      {/* Desktop Player Bar */}
      <footer className="hidden lg:flex h-20 bg-player border-t border-border items-center px-4 gap-4">
        {/* Left - Song info */}
        <div className="w-[30%] min-w-[180px] flex items-center gap-3">
          {currentSong ? (
            <>
              <div 
                className="w-14 h-14 rounded bg-secondary overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowFullScreen(true)}
              >
                {loadedCoverUrl ? (
                  <img 
                    src={loadedCoverUrl} 
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate hover:underline cursor-pointer">
                  {currentSong.title}
                </p>
                <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">
                  {currentSong.artist}
                </p>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No song playing</div>
          )}
        </div>

        {/* Center - Controls */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-[722px]">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-1 transition-colors",
                shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Shuffle size={18} />
            </button>
            
            <button
              onClick={prevSong}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause size={18} className="text-background" fill="currentColor" />
              ) : (
                <Play size={18} className="text-background ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <button
              onClick={nextSong}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
            
            <button
              onClick={toggleRepeat}
              className={cn(
                "p-1 transition-colors",
                repeat !== 'off' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-1 bg-track rounded-full cursor-pointer group relative"
            >
              <div 
                className="h-full bg-foreground group-hover:bg-primary rounded-full transition-colors relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right - Volume & extras */}
        <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-3">
          <button
            onClick={onToggleLyrics}
            className={cn(
              "p-1 transition-colors",
              showLyrics ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title="Lyrics"
          >
            <Mic2 size={18} />
          </button>
          
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ListMusic size={18} />
          </button>

          {/* Delete button */}
          {currentSong && (
            <button 
              onClick={handleDelete}
              className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
              title="Delete song"
            >
              <Trash2 size={18} />
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-track rounded-full appearance-none cursor-pointer volume-slider"
            />
          </div>
          
          <button 
            onClick={() => setShowFullScreen(true)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </footer>
    </>
  );
}
