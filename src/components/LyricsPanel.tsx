import { useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LyricsPanel({ isOpen, onClose }: LyricsPanelProps) {
  const { playerState, currentLyricIndex } = useMusicStore();
  const { currentSong } = playerState;
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);

  // Auto-scroll to active lyric
  useEffect(() => {
    if (activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLyric = activeLyricRef.current;
      
      const containerHeight = container.clientHeight;
      const lyricTop = activeLyric.offsetTop;
      const lyricHeight = activeLyric.clientHeight;
      
      const scrollTo = lyricTop - containerHeight / 2 + lyricHeight / 2;
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [currentLyricIndex]);

  if (!isOpen) return null;

  const lyrics = currentSong?.lyrics || [];
  const hasLyrics = lyrics.length > 0;

  return (
    <div className="w-96 bg-gradient-to-b from-card to-background border-l border-border flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold">Lyrics</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-accent transition-colors"
        >
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Song info */}
      {currentSong && (
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="w-12 h-12 rounded bg-secondary overflow-hidden">
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
            <p className="font-semibold text-sm truncate">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
          </div>
        </div>
      )}

      {/* Lyrics content */}
      <div 
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto p-6"
      >
        {!currentSong ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Play a song to see lyrics
            </p>
          </div>
        ) : !hasLyrics ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                No lyrics available
              </p>
              <p className="text-xs text-muted-foreground">
                Lyrics will appear here when available
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-12">
            {lyrics.map((line, index) => (
              <p
                key={index}
                ref={index === currentLyricIndex ? activeLyricRef : null}
                className={cn(
                  "text-2xl font-bold transition-all duration-300 cursor-pointer hover:text-foreground",
                  index === currentLyricIndex 
                    ? "text-foreground lyrics-active scale-105" 
                    : index < currentLyricIndex 
                      ? "text-muted-foreground/50" 
                      : "text-muted-foreground/70"
                )}
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
