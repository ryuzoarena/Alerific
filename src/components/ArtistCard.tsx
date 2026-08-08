import { useMusicStore } from '@/stores/musicStore';
import { Song } from '@/types/music';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';

interface ArtistCardProps {
  artistName: string;
  songs: Song[];
  onClick: () => void;
}

/** Desktop-only card variant styled like the playlist/song grid cards */
export function ArtistGridCard({ artistName, songs, onClick }: ArtistCardProps) {
  const coverUrl = songs.find((s) => s.coverUrl)?.coverUrl;
  const { playSong } = useMusicStore();
  const timeTheme = useTimeTheme();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (songs[0]) playSong(songs[0], songs);
  };

  return (
    <div
      onClick={onClick}
      className="song-card bg-card hover:bg-card-hover rounded-lg cursor-pointer group relative w-full p-3 transition-all duration-200 hover:scale-105 hover:brightness-110"
    >
      <div className="relative mb-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary shadow-lg">
          {coverUrl ? (
            <img src={coverUrl} alt={artistName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-foreground/70">
                {artistName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handlePlay}
          className={cn(
            'play-overlay absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:opacity-90 transition-all theme-transition',
            timeTheme.accentBg,
          )}
        >
          <Play size={16} className={`${timeTheme.buttonText} ml-0.5`} fill="currentColor" />
        </button>
      </div>
      <h3 className="font-semibold truncate mb-0.5 text-[13px] leading-tight text-foreground">{artistName}</h3>
      <p className="truncate text-[12px] text-[#b3b3b3]">{songs.length} songs</p>
    </div>
  );
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
      <span className="text-sm sm:text-base font-semibold text-foreground truncate w-full text-center">
        {artistName}
      </span>
    </button>
  );
}
