import { useMusicStore } from '@/stores/musicStore';
import { LibrarySongCard } from '@/components/LibrarySongCard';
import { Play, Music2, Shuffle, ArrowLeft, Plus } from 'lucide-react';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useState, useEffect } from 'react';

interface LibraryViewProps {
  isDeleteMode?: boolean;
  onBack?: () => void;
}

export function LibraryView({ isDeleteMode, onBack }: LibraryViewProps) {
  const { songs, playSong, fetchSongs, songsLoaded } = useMusicStore();
  const timeTheme = useTimeTheme();
  const [isShuffleActive, setIsShuffleActive] = useState(false);

  useEffect(() => {
    if (!songsLoaded) fetchSongs();
  }, [songsLoaded, fetchSongs]);

  const firstSongCover = songs.length > 0 ? songs[0].coverUrl : null;

  const handlePlayAll = () => {
    if (songs.length > 0) {
      const songsToPlay = isShuffleActive ? [...songs].sort(() => Math.random() - 0.5) : songs;
      playSong(songsToPlay[0], songsToPlay);
    }
  };

  const handleShuffle = () => {
    setIsShuffleActive(!isShuffleActive);
    if (songs.length > 0) {
      const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
      playSong(shuffledSongs[0], shuffledSongs);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24 bg-background">
      <div className={`px-4 pt-4 pb-6 theme-transition bg-gradient-to-b ${timeTheme.gradient}`}>
        {onBack && (
          <button onClick={onBack} className="mb-4 text-foreground hover:text-muted-foreground transition-colors">
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">All Songs</h1>
        <p className="text-sm text-muted-foreground mb-4">{songs.length} songs</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0 border border-border">
              {firstSongCover ? (
                <img src={firstSongCover} alt="Library cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <Music2 size={20} className="text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleShuffle} className={`p-2 transition-colors ${isShuffleActive ? timeTheme.accentColor : 'text-muted-foreground hover:text-foreground'}`}>
              <Shuffle size={22} />
            </button>
            <button onClick={handlePlayAll} className={`w-12 h-12 theme-transition ${timeTheme.accentBg} rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg`}>
              <Play size={24} className={`${timeTheme.buttonText} ml-0.5`} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 mb-2">
        <button className="flex items-center gap-3 w-full py-3 hover:bg-accent rounded-md transition-colors px-2">
          <div className="w-12 h-12 rounded-md bg-card border border-dashed border-muted-foreground/50 flex items-center justify-center">
            <Plus size={20} className="text-muted-foreground" />
          </div>
          <span className="text-sm font-medium">Add to playlist</span>
        </button>
      </div>
      <div className="px-2">
        {songs.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={64} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">No songs yet</h2>
            <p className="text-muted-foreground">Add songs to start your library</p>
          </div>
        ) : (
          songs.map((song) => (
            <LibrarySongCard key={song.id} song={song} queue={songs} isDeleteMode={isDeleteMode} />
          ))
        )}
      </div>
    </div>
  );
}
