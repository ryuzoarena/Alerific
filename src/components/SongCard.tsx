import { Play, Trash2, MoreVertical, ListPlus } from 'lucide-react';
import { Song } from '@/types/music';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SongCardProps {
  song: Song;
  index?: number;
  showIndex?: boolean;
  queue?: Song[];
  isDeleteMode?: boolean;
  compact?: boolean;
  hideAlbum?: boolean;
}

export function SongCard({ song, index, showIndex, queue, isDeleteMode, hideAlbum }: SongCardProps) {
  const { playSong, playerState, removeSong, addToUserQueue } = useMusicStore();
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const isActive = playerState.currentSong?.id === song.id;

  const handlePlay = () => playSong(song, queue);
  const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); removeSong(song.id); };
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToUserQueue(song);
    toast.success(`"${song.title}" ditambahkan ke antrian`);
  };

  return (
    <div className={cn("group flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer", isActive && "bg-accent")} onClick={handlePlay}>

      <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isActive ? "text-primary" : "text-foreground")}>{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>

      {!hideAlbum && (
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{song.album || 'Unknown Album'}</p>
        </div>
      )}

      {isDeleteMode && (
        <Button variant="plain" size="plain" onClick={handleDelete} className="text-destructive hover:text-destructive" title="Delete song">
          <Trash2 size={16} />
        </Button>
      )}

      {/* Three-dot menu with Add to Queue */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="plain" size="plain" className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleAddToQueue}>
            <ListPlus size={16} className="mr-2" /> Add to Queue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Grid card variant for home view
export function SongGridCard({ song, queue, isDeleteMode, compact }: SongCardProps) {
  const { playSong, playerState, togglePlay, removeSong, addToUserQueue } = useMusicStore();
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const isActive = playerState.currentSong?.id === song.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) togglePlay();
    else playSong(song, queue);
  };

  const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); removeSong(song.id); };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToUserQueue(song);
    toast.success(`"${song.title}" added to queue`);
  };

  return (
    <div className={cn(
      "song-card bg-card hover:bg-card-hover rounded-lg cursor-pointer group relative w-full transition-all duration-200",
      compact ? "p-3 hover:scale-105 hover:brightness-110" : "p-2 sm:p-3 md:p-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
    )}>
      <div className={cn("relative", compact ? "mb-2" : "mb-2 sm:mb-3 md:mb-4")}>
        <div className={cn("aspect-square overflow-hidden bg-secondary shadow-lg", compact ? "rounded-lg" : "rounded-lg")}>
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
        </div>
        {isDeleteMode && (
          <Button variant="plain" size="plain" onClick={handleDelete} className="absolute top-1 right-1 w-11 h-11 bg-destructive rounded-full flex items-center justify-center shadow-lg animate-pulse hover:bg-destructive/90 transition-colors" title="Delete song">
            <Trash2 size={14} className="text-foreground" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="plain" size="plain" className="absolute top-1 right-1 w-11 h-11 bg-background/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={14} className="text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleAddToQueue}>
              <ListPlus size={16} className="mr-2" /> Add to Queue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="plain" size="plain" onClick={handlePlay} className={cn(
          "play-overlay absolute bottom-2 right-2 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:opacity-90 transition-all theme-transition",
          "bg-primary",
          compact ? "w-11 h-11" : "w-9 h-9"
        )}>
          {isPlaying ? (
            <span className="flex gap-0.5">
              <span className={`w-0.5 h-3 text-primary-foreground rounded-full`} style={{ backgroundColor: 'currentColor' }} />
              <span className={`w-0.5 h-3 text-primary-foreground rounded-full`} style={{ backgroundColor: 'currentColor' }} />
            </span>
          ) : (
            <Play size={compact ? 16 : 18} className={`text-primary-foreground ml-0.5`} fill="currentColor" />
          )}
        </Button>
      </div>
      <h3 className={cn(
        "font-semibold truncate mb-0.5 theme-transition",
        compact ? "text-[13px] leading-tight" : "text-sm md:text-base mb-1",
        isActive ? "text-primary" : "text-foreground"
      )}>{song.title}</h3>
      <p className={cn(
        "truncate",
        compact ? "text-[12px] text-muted-foreground" : "text-xs md:text-sm text-muted-foreground"
      )}>{song.artist}</p>
    </div>
  );
}
