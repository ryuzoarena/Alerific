import { Song } from '@/types/music';
import { useMusicStore } from '@/stores/musicStore';
import { MoreVertical, Music2 } from 'lucide-react';

interface RecentlyPlayedCardProps {
  song: Song;
  queue: Song[];
}

export function RecentlyPlayedCard({ song, queue }: RecentlyPlayedCardProps) {
  const { playSong } = useMusicStore();

  return (
    <button
      onClick={() => playSong(song, queue)}
      className="flex items-center gap-3 w-full p-2 rounded-lg bg-black/40 hover:bg-black/60 transition-colors group text-left"
    >
      {/* Cover */}
      <div className="w-14 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0">
        {song.coverUrl ? (
          <img 
            src={song.coverUrl} 
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
            <Music2 size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-foreground">
          {song.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {song.artist}
        </p>
      </div>

      {/* More button */}
      <button 
        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Open context menu
        }}
      >
        <MoreVertical size={18} className="text-muted-foreground" />
      </button>
    </button>
  );
}
