import { useRef, useEffect, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Shuffle, Repeat, Repeat1, Mic2, ListMusic, Maximize2, Menu 
} from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';

interface PlayerBarProps {
  onToggleLyrics: () => void;
  showLyrics: boolean;
}

export function PlayerBar({ onToggleLyrics, showLyrics }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
    toggleSidebar,
  } = useMusicStore();

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted, shuffle, repeat } = playerState;

  // Load audio source when song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    
    // Set the audio source from uploaded file or demo
    if (currentSong.audioUrl) {
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.load();
    }
  }, [currentSong?.id]);

  // Sync audio with player state
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying && currentSong.audioUrl) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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

  const handleEnded = () => {
    if (repeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      nextSong();
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="h-auto md:h-20 bg-player border-t border-border flex flex-col md:flex-row items-center px-2 md:px-4 gap-2 md:gap-4 py-2 md:py-0">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Left - Song info with menu button on mobile */}
      <div className="w-full md:w-[30%] md:min-w-[180px] flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={20} />
        </button>

        {currentSong ? (
          <>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded bg-secondary overflow-hidden flex-shrink-0">
              {currentSong.coverUrl ? (
                <img 
                  src={currentSong.coverUrl} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium truncate hover:underline cursor-pointer">
                {currentSong.title}
              </p>
              <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">
                {currentSong.artist}
              </p>
            </div>
          </>
        ) : (
          <div className="text-xs md:text-sm text-muted-foreground">No song playing</div>
        )}
      </div>

      {/* Center - Controls */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-[722px] w-full">
        <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
          <button
            onClick={toggleShuffle}
            className={cn(
              "p-1 transition-colors hidden sm:block",
              shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shuffle size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
          
          <button
            onClick={prevSong}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipBack size={18} className="md:w-5 md:h-5" fill="currentColor" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause size={16} className="md:w-[18px] md:h-[18px] text-background" fill="currentColor" />
            ) : (
              <Play size={16} className="md:w-[18px] md:h-[18px] text-background ml-0.5" fill="currentColor" />
            )}
          </button>
          
          <button
            onClick={nextSong}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward size={18} className="md:w-5 md:h-5" fill="currentColor" />
          </button>
          
          <button
            onClick={toggleRepeat}
            className={cn(
              "p-1 transition-colors hidden sm:block",
              repeat !== 'off' ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {repeat === 'one' ? <Repeat1 size={16} className="md:w-[18px] md:h-[18px]" /> : <Repeat size={16} className="md:w-[18px] md:h-[18px]" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[10px] md:text-xs text-muted-foreground w-8 md:w-10 text-right">
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
          
          <span className="text-[10px] md:text-xs text-muted-foreground w-8 md:w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right - Volume & extras */}
      <div className="hidden md:flex w-[30%] min-w-[180px] items-center justify-end gap-3">
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
        
        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Mobile extra controls */}
      <div className="flex md:hidden items-center gap-4 w-full justify-center pb-1">
        <button
          onClick={toggleShuffle}
          className={cn(
            "p-1 transition-colors",
            shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Shuffle size={16} />
        </button>
        <button
          onClick={toggleRepeat}
          className={cn(
            "p-1 transition-colors",
            repeat !== 'off' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
        </button>
        <button
          onClick={onToggleLyrics}
          className={cn(
            "p-1 transition-colors",
            showLyrics ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          title="Lyrics"
        >
          <Mic2 size={16} />
        </button>
        <button
          onClick={toggleMute}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </footer>
  );
}
