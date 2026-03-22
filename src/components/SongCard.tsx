import { Play, Heart, Trash2, MoreVertical, ListPlus } from 'lucide-react';
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
  const { playSong, playerState, removeSong } = useMusicStore();
  const timeTheme = useTimeTheme();
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const isActive = playerState.currentSong?.id === song.id;

  const handlePlay = () => playSong(song, queue);
  const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); removeSong(song.id); };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("group flex items-center gap-4 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer", isActive && "bg-accent")} onClick={handlePlay}>
      <div className="w-8 flex items-center justify-center">
        {showIndex ? (
          <>
            <span className={cn("text-sm group-hover:hidden", isActive ? timeTheme.accentColor : "text-muted-foreground")}>
              {isPlaying ? (
                <span className="flex gap-0.5">
                  <span className={`w-1 h-3 ${timeTheme.accentBg} rounded-full animate-pulse`} />
                  <span className={`w-1 h-3 ${timeTheme.accentBg} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }} />
                  <span className={`w-1 h-3 ${timeTheme.accentBg} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }} />
                </span>
              ) : (index! + 1)}
            </span>
            <Play size={16} className="hidden group-hover:block text-foreground" fill="currentColor" />
          </>
        ) : (
          <Play size={16} className="opacity-0 group-hover:opacity-100 text-foreground transition-opacity" fill="currentColor" />
        )}
      </div>

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

      <div className={cn("flex items-center gap-2 transition-opacity", isDeleteMode ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
        <button className="text-muted-foreground hover:text-foreground"><Heart size={16} /></button>
        {isDeleteMode && (
          <button onClick={handleDelete} className="text-red-400 hover:text-red-300 animate-pulse" title="Delete song"><Trash2 size={16} /></button>
        )}
      </div>

      <div className="w-12 text-right">
        <span className="text-sm text-muted-foreground">{formatDuration(song.duration)}</span>
      </div>
    </div>
  );
}

// Grid card variant for home view
export function SongGridCard({ song, queue, isDeleteMode }: SongCardProps) {
  const { playSong, playerState, togglePlay, removeSong } = useMusicStore();
  const timeTheme = useTimeTheme();
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const isActive = playerState.currentSong?.id === song.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) togglePlay();
    else playSong(song, queue);
  };

  const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); removeSong(song.id); };

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
