import { Play, Trash2, MoreVertical, ListPlus } from 'lucide-react';
import { Song } from '@/types/music';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';
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
}

export function SongCard({ song, index, showIndex, queue, isDeleteMode }: SongCardProps) {
  const { playSong, playerState, removeSong, addToUserQueue } = useMusicStore();
  const timeTheme = useTimeTheme();
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
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isActive ? timeTheme.accentColor : "text-foreground")}>{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>

      <div className="hidden md:block flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{song.album || 'Unknown Album'}</p>
      </div>

      {isDeleteMode && (
        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 animate-pulse" title="Delete song">
          <Trash2 size={16} />
        </button>
      )}

      {/* Three-dot menu with Add to Queue */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical size={18} />
          </button>
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
export function SongGridCard({ song, queue, isDeleteMode }: SongCardProps) {
  const { playSong, playerState, togglePlay, removeSong, addToUserQueue } = useMusicStore();
  const timeTheme = useTimeTheme();
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
    <div className="song-card bg-card p-2 sm:p-3 md:p-4 rounded-lg cursor-pointer group relative w-full">
      <div className="relative mb-2 sm:mb-3 md:mb-4">
        <div className="aspect-square rounded-lg overflow-hidden bg-secondary shadow-lg">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
          )}
        </div>
        {isDeleteMode && (
          <button onClick={handleDelete} className="absolute top-1 right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse hover:bg-red-400 transition-colors" title="Delete song">
            <Trash2 size={14} className="text-white" />
          </button>
        )}
        
        {/* More options button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-1 right-1 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={14} className="text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleAddToQueue}>
              <ListPlus size={16} className="mr-2" /> Add to Queue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button onClick={handlePlay} className={`play-overlay absolute bottom-2 right-2 w-9 h-9 theme-transition ${timeTheme.accentBg} rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:opacity-90 transition-all`}>
          {isPlaying ? (
            <span className="flex gap-0.5">
              <span className={`w-0.5 h-3 ${timeTheme.buttonText} rounded-full`} style={{ backgroundColor: 'currentColor' }} />
              <span className={`w-0.5 h-3 ${timeTheme.buttonText} rounded-full`} style={{ backgroundColor: 'currentColor' }} />
            </span>
          ) : (
            <Play size={18} className={`${timeTheme.buttonText} ml-0.5`} fill="currentColor" />
          )}
        </button>
      </div>
      <h3 className={cn("font-semibold text-sm md:text-base truncate mb-1 theme-transition", isActive ? timeTheme.accentColor : "text-foreground")}>{song.title}</h3>
      <p className="text-xs md:text-sm text-muted-foreground truncate">{song.artist}</p>
    </div>
  );
}
