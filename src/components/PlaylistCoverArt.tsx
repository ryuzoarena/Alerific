import { Music2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Playlist, Song } from '@/types/music';

interface Props {
  playlist: Playlist;
  songs: Song[]; // songs that are in the playlist (in order)
  size: number; // px
  className?: string;
  rounded?: string; // tailwind class e.g. "rounded-md"
}

/**
 * Renders the playlist artwork:
 * 1) uploaded cover image (coverUrl)
 * 2) 2x2 collage of first 4 song covers when ≥4 songs
 * 3) gradient placeholder otherwise
 */
export function PlaylistCoverArt({ playlist, songs, size, className, rounded = 'rounded-md' }: Props) {
  const isLiked = playlist.id === 'liked';

  // 1) Uploaded cover wins
  if (playlist.coverUrl) {
    return (
      <div
        className={cn('overflow-hidden flex-shrink-0', rounded, className)}
        style={{ width: size, height: size }}
      >
        <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  // 2) Collage of 4 covers
  const coverable = songs.filter((s) => s.coverUrl).slice(0, 4);
  if (coverable.length >= 4) {
    return (
      <div
        className={cn('overflow-hidden grid grid-cols-2 grid-rows-2 flex-shrink-0', rounded, className)}
        style={{ width: size, height: size }}
      >
        {coverable.map((s) => (
          <img key={s.id} src={s.coverUrl} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  // 3) Gradient placeholder
  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0',
        rounded,
        isLiked
          ? 'bg-gradient-to-br from-indigo-600 to-purple-400'
          : 'bg-gradient-to-br from-violet-600 to-fuchsia-500',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {isLiked ? (
        <Heart className="text-white" size={Math.max(16, size * 0.35)} fill="white" />
      ) : (
        <Music2 className="text-white/90" size={Math.max(14, size * 0.3)} />
      )}
    </div>
  );
}
