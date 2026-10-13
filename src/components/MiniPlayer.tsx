import { Play, Pause, Heart, Speaker } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  loadedCoverUrl: string | null;
  onClick: () => void;
}

export function MiniPlayer({ loadedCoverUrl, onClick }: MiniPlayerProps) {
  const { playerState, togglePlay, playlists, addSongToPlaylist, removeSongFromPlaylist } = useMusicStore();
  const { currentSong, isPlaying, currentTime, duration } = playerState;

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
      className="mobile-mini-player min-[1100px]:hidden fixed left-2 right-2 z-40 cursor-pointer"
    >
      <div 
        className="rounded-lg bg-sidebar border border-border p-2 flex items-center gap-3 relative overflow-hidden transition-colors duration-500"
        
      >
        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground/20">
          <div 
            className="h-full bg-foreground transition-all"
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
            <div className="w-full h-full bg-secondary" />
          )}
        </div>

        {/* Song info with marquee animation */}
        <div className="flex-1 min-w-0  overflow-hidden">
          <div className="marquee-container">
            <p 
              className="text-sm font-medium text-foreground whitespace-nowrap animate-marquee"
              data-text={currentSong.title}
            >
              {currentSong.title}
            </p>
          </div>
          <p className="text-xs text-foreground/60 truncate">
            {currentSong.artist}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Connect/Speaker button */}
          <Button variant="plain" size="plain"
            onClick={handleConnectClick} aria-label="Connect speaker"
            className="min-w-11 min-h-11 p-2 text-foreground/80 hover:text-foreground transition-colors"
          >
            <Speaker size={20} />
          </Button>

          {/* Like button */}
          <Button variant="plain" size="plain"
            onClick={handleLikeClick} aria-label={isLiked ? "Unlike song" : "Like song"}
            className={cn(
              "p-2 transition-colors",
              isLiked ? "text-primary" : "text-foreground/80 hover:text-foreground"
            )}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </Button>

          {/* Play button */}
          <Button variant="plain" size="plain"
            onClick={handlePlayClick} aria-label={isPlaying ? "Pause" : "Play"}
            className="min-w-11 min-h-11 p-2 text-foreground"
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
