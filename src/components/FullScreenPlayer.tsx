import { useEffect, useRef, useState } from 'react';
import { 
  ChevronDown, Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Heart, Share2, ListMusic, Trash2, Mic2
} from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';
import { MobileLyricsView } from './MobileLyricsView';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  loadedCoverUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function FullScreenPlayer({ isOpen, onClose, loadedCoverUrl, audioRef }: FullScreenPlayerProps) {
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const [showMobileLyrics, setShowMobileLyrics] = useState(false);
  
  const {
    playerState,
    currentLyricIndex,
    togglePlay,
    nextSong,
    prevSong,
    toggleShuffle,
    toggleRepeat,
    setCurrentTime,
    removeSong,
  } = useMusicStore();

  const { currentSong, isPlaying, currentTime, duration, shuffle, repeat } = playerState;
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
      
      const scrollTo = lyricTop - containerHeight / 2 + lyricHeight / 2;
      
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

  const handleDelete = () => {
    if (currentSong) {
      removeSong(currentSong.id);
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-neutral-800 to-black flex flex-col">
      {/* Background with album art blur */}
      {loadedCoverUrl && (
        <div 
          className="absolute inset-0 opacity-30 blur-3xl scale-110"
          style={{
            backgroundImage: `url(${loadedCoverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronDown size={24} className="text-white" />
          </button>
          
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 uppercase tracking-wider">Now Playing</p>
          </div>
          
          <button 
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-400 hover:text-red-300"
            title="Delete song"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Album Art - Desktop shows larger */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 max-h-[40vh] md:max-h-[45vh]">
          <div className="w-full max-w-[280px] md:max-w-[400px] aspect-square rounded-lg overflow-hidden shadow-2xl">
            {loadedCoverUrl ? (
              <img 
                src={loadedCoverUrl} 
                alt={currentSong?.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
            )}
          </div>
        </div>

        {/* Song Info */}
        <div className="px-6 md:px-16 py-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">
              {currentSong?.title || 'No song playing'}
            </h2>
            <p className="text-sm md:text-base text-white/60 truncate">
              {currentSong?.artist || 'Unknown artist'}
            </p>
          </div>
          <button className="p-2 text-white/60 hover:text-white">
            <Heart size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 md:px-16">
          <div 
            onClick={handleProgressClick}
            className="h-1 bg-white/20 rounded-full cursor-pointer group"
          >
            <div 
              className="h-full bg-white rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/60">{formatTime(currentTime)}</span>
            <span className="text-xs text-white/60">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 md:gap-8 py-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              "p-2 transition-colors",
              shuffle ? "text-primary" : "text-white/60 hover:text-white"
            )}
          >
            <Shuffle size={22} />
          </button>
          
          <button
            onClick={prevSong}
            className="p-2 text-white hover:scale-110 transition-transform"
          >
            <SkipBack size={32} fill="currentColor" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause size={32} className="text-black" fill="currentColor" />
            ) : (
              <Play size={32} className="text-black ml-1" fill="currentColor" />
            )}
          </button>
          
          <button
            onClick={nextSong}
            className="p-2 text-white hover:scale-110 transition-transform"
          >
            <SkipForward size={32} fill="currentColor" />
          </button>
          
          <button
            onClick={toggleRepeat}
            className={cn(
              "p-2 transition-colors",
              repeat !== 'off' ? "text-primary" : "text-white/60 hover:text-white"
            )}
          >
            {repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between px-6 md:px-16 py-2">
          <button className="p-2 text-white/60 hover:text-white">
            <ListMusic size={20} />
          </button>
          
          {/* Show Lyrics Button - Mobile only */}
          {hasLyrics && (
            <button 
              onClick={() => setShowMobileLyrics(true)}
              className="md:hidden p-2 text-white/60 hover:text-white"
              title="Show lyrics"
            >
              <Mic2 size={20} />
            </button>
          )}
          
          <button className="p-2 text-white/60 hover:text-white">
            <Share2 size={20} />
          </button>
        </div>

        {/* Lyrics Preview Section - with Show Lyrics button on mobile */}
        {hasLyrics && (
          <div 
            ref={lyricsContainerRef}
            className="mx-4 md:mx-12 mb-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 max-h-[25vh] overflow-y-auto"
          >
            <p className="text-sm text-white/60 mb-3">Lyrics Preview</p>
            <div className="space-y-3">
              {lyrics.slice(0, 5).map((line, index) => (
                <p
                  key={index}
                  ref={index === currentLyricIndex ? activeLyricRef : null}
                  className={cn(
                    "text-lg md:text-xl font-bold transition-all duration-300",
                    index === currentLyricIndex 
                      ? "text-white" 
                      : index < currentLyricIndex 
                        ? "text-white/40" 
                        : "text-white/60"
                  )}
                >
                  {line.text}
                </p>
              ))}
            </div>
            
            {/* Show full lyrics button - Mobile only */}
            <button
              onClick={() => setShowMobileLyrics(true)}
              className="md:hidden mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium text-white transition-colors"
            >
              Show full lyrics
            </button>
          </div>
        )}
      </div>

      {/* Mobile Lyrics View */}
      <MobileLyricsView
        isOpen={showMobileLyrics}
        onClose={() => setShowMobileLyrics(false)}
        loadedCoverUrl={loadedCoverUrl}
        audioRef={audioRef}
      />
    </div>
  );
}
