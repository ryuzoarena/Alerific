import { Play, Pause, Heart, Speaker } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useDominantColor } from '@/hooks/useDominantColor';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  loadedCoverUrl: string | null;
  onClick: () => void;
}

export function MiniPlayer({ loadedCoverUrl, onClick }: MiniPlayerProps) {
  const { playerState, togglePlay, playlists, addSongToPlaylist, removeSongFromPlaylist } = useMusicStore();
  const { currentSong, isPlaying, currentTime, duration } = playerState;
  const dominantColor = useDominantColor(loadedCoverUrl);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Check if song is liked
  const likedPlaylist = playlists.find(p => p.id === 'liked');
  const isLiked = likedPlaylist?.songIds.includes(currentSong.id) || false;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      removeSongFromPlaylist('liked', currentSong.id);
    } else {
      addSongToPlaylist('liked', currentSong.id);
    }
  };

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for device connection feature
  };

  return (
    <div 
      onClick={onClick}
      className="lg:hidden fixed bottom-[88px] left-2 right-2 z-40 cursor-pointer"
    >
      <div 
        className="rounded-lg p-2 flex items-center gap-3 relative overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: dominantColor || 'rgb(68, 44, 44)' }}
      >
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

        {/* Song info with marquee animation */}
        <div className="flex-1 min-w-0 max-w-[100px] overflow-hidden">
          <div className="marquee-container">
            <p 
              className="text-sm font-medium text-white whitespace-nowrap animate-marquee"
              data-text={currentSong.title}
            >
              {currentSong.title}
            </p>
          </div>
          <p className="text-xs text-white/60 truncate">
            {currentSong.artist}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Connect/Speaker button */}
          <button
            onClick={handleConnectClick}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <Speaker size={20} />
          </button>

          {/* Like button */}
          <button
            onClick={handleLikeClick}
            className={cn(
              "p-2 transition-colors",
              isLiked ? "text-green-500" : "text-white/80 hover:text-white"
            )}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>

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
    </div>
  );
}
