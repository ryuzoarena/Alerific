import { ArrowLeft, Play, Shuffle } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { SongCard } from '@/components/SongCard';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useMemo } from 'react';

interface ArtistViewProps {
  artistName: string;
  onBack: () => void;
  isDeleteMode?: boolean;
}

export function ArtistView({ artistName, onBack, isDeleteMode }: ArtistViewProps) {
  const { songs, playSong, playerState, toggleShuffle } = useMusicStore();
  const timeTheme = useTimeTheme();

  const artistSongs = useMemo(
    () => songs.filter(s => s.artist.toLowerCase() === artistName.toLowerCase()),
    [songs, artistName]
  );

  const coverUrl = artistSongs.find(s => s.coverUrl)?.coverUrl;

  const handlePlayAll = () => {
    if (artistSongs.length > 0) {
      playSong(artistSongs[0], artistSongs);
    }
  };

  const handleShufflePlay = () => {
    if (artistSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * artistSongs.length);
      playSong(artistSongs[randomIndex], artistSongs);
      if (!playerState.shuffle) toggleShuffle();
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Hero header */}
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>

        {/* Artist name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground drop-shadow-lg">
            {artistName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {artistSongs.length} lagu
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 px-4 py-4">
        <button
          onClick={handleShufflePlay}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Shuffle size={24} />
        </button>
        <button
          onClick={handlePlayAll}
          className={`w-12 h-12 rounded-full theme-transition ${timeTheme.accentBg} flex items-center justify-center shadow-xl hover:scale-105 transition-transform`}
        >
          <Play size={22} className={`${timeTheme.buttonText} ml-0.5`} fill="currentColor" />
        </button>
      </div>

      {/* Song list */}
      <div className="px-2 sm:px-4">
        <h2 className="text-lg font-bold mb-2 px-2">Populer</h2>
        <div className="space-y-0.5">
          {artistSongs.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              index={index}
              showIndex
              queue={artistSongs}
              isDeleteMode={isDeleteMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
