import { useEffect, useRef } from 'react';
import { ChevronDown, Play, Pause, Share2, MoreVertical } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useDominantColor } from '@/hooks/useDominantColor';
import { cn } from '@/lib/utils';

interface MobileLyricsViewProps {
  isOpen: boolean;
  onClose: () => void;
  loadedCoverUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function MobileLyricsView({ isOpen, onClose, loadedCoverUrl, audioRef }: MobileLyricsViewProps) {
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const dominantColor = useDominantColor(loadedCoverUrl);
  
  const {
    playerState,
    currentLyricIndex,
    togglePlay,
    setCurrentTime,
  } = useMusicStore();

  const { currentSong, isPlaying, currentTime, duration } = playerState;
  const lyrics = currentSong?.lyrics || [];
  const hasLyrics = lyrics.length > 0;

  // Auto-scroll to active lyric
  useEffect(() => {
    if (activeLyricRef.current && lyricsContainerRef.current && isOpen) {
      const container = lyricsContainerRef.current;
      const activeLyric = activeLyricRef.current;
      
      const containerHeight = container.clientHeight;
      const lyricTop = activeLyric.offsetTop;
      const lyricHeight = activeLyric.clientHeight;
      
      const scrollTo = lyricTop - containerHeight / 3 + lyricHeight / 2;
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [currentLyricIndex, isOpen]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isOpen || !currentSong) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex flex-col transition-colors duration-500"
      style={{ 
        background: dominantColor 
          ? `linear-gradient(to bottom, ${dominantColor}, ${dominantColor}dd)` 
          : 'linear-gradient(to bottom, #4a7c7c, #3d6666)' 
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronDown size={28} className="text-white" />
        </button>
        
        <div className="text-center flex-1">
          <p className="text-base font-semibold text-white">{currentSong.title}</p>
          <p className="text-sm text-white/70">{currentSong.artist}</p>
        </div>
        
        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Scrollable Lyrics Area */}
      <div 
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-8 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {!hasLyrics ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/60 text-center text-lg">
              No lyrics available
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {lyrics.map((line, index) => (
              <p
                key={index}
                ref={index === currentLyricIndex ? activeLyricRef : null}
                className={cn(
                  "text-xl font-bold transition-all duration-300 leading-relaxed",
                  index === currentLyricIndex 
                    ? "text-white scale-[1.02]" 
                    : index < currentLyricIndex 
                      ? "text-white/40" 
                      : "text-white/60"
                )}
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 pb-8">
        {/* Secondary actions */}
        <div className="flex items-center justify-between mb-4 px-2">
          <button className="p-2 text-white/70 hover:text-white">
            <Share2 size={22} />
          </button>
          <button className="p-2 text-white/70 hover:text-white">
            <MoreVertical size={22} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            onClick={handleProgressClick}
            className="h-1 bg-white/30 rounded-full cursor-pointer group"
          >
            <div 
              className="h-full bg-white rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/70">{formatTime(currentTime)}</span>
            <span className="text-xs text-white/70">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play Button */}
        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause size={32} className="text-black/80" fill="currentColor" />
            ) : (
              <Play size={32} className="text-black/80 ml-1" fill="currentColor" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}