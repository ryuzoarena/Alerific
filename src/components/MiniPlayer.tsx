import { Play, Pause } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';

interface MiniPlayerProps {
  loadedCoverUrl: string | null;
  onClick: () => void;
}

export function MiniPlayer({ loadedCoverUrl, onClick }: MiniPlayerProps) {
  const { playerState, togglePlay } = useMusicStore();
  const { currentSong, isPlaying, currentTime, duration } = playerState;

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  return (
    <div 
      onClick={onClick}
      className="lg:hidden fixed bottom-[72px] left-2 right-2 z-40 cursor-pointer"
    >
      <div className="bg-[#442c2c] rounded-lg p-2 flex items-center gap-3 relative overflow-hidden">
        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
          <div 
            className="h-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cover */}
        <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
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

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentSong.title}
          </p>
          <p className="text-xs text-white/60 truncate">
            {currentSong.artist}
          </p>
        </div>

        {/* Play button */}
        <button
          onClick={handlePlayClick}
          className="p-2 text-white"
        >
          {isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
