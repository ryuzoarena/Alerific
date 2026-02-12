import { useMusicStore } from '@/stores/musicStore';
import { Song } from '@/types/music';

interface ArtistCardProps {
  artistName: string;
  songs: Song[];
  onClick: () => void;
}

export function ArtistCard({ artistName, songs, onClick }: ArtistCardProps) {
  // Use the first song's cover as artist image
  const coverUrl = songs.find(s => s.coverUrl)?.coverUrl;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group cursor-pointer w-28 sm:w-32 md:w-36 flex-shrink-0"
    >
      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-secondary shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground/70">
              {artistName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-foreground truncate w-full text-center">
        {artistName}
      </span>
      <span className="text-[10px] sm:text-xs text-muted-foreground -mt-1">
        {songs.length} lagu
      </span>
    </button>
  );
}
