import { useMusicStore } from '@/stores/musicStore';
import { SongCard } from '@/components/SongCard';
import { Clock, Play, Heart, Music2 } from 'lucide-react';

interface LibraryViewProps {
  isDeleteMode?: boolean;
}

export function LibraryView({ isDeleteMode }: LibraryViewProps) {
  const { songs, playSong } = useMusicStore();

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header with gradient */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-b from-primary/30 to-background" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
          <div className="w-56 h-56 bg-gradient-to-br from-indigo-600 to-purple-400 rounded shadow-2xl flex items-center justify-center">
            <Music2 size={80} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Playlist</p>
            <h1 className="text-5xl font-bold mb-4">All Songs</h1>
            <p className="text-muted-foreground">
              {songs.length} songs
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
        >
          <Play size={28} className="text-primary-foreground ml-1" fill="currentColor" />
        </button>
      </div>

      {/* Track list header */}
      <div className="px-6 border-b border-border">
        <div className="flex items-center gap-4 py-2 text-sm text-muted-foreground">
          <div className="w-8 text-center">#</div>
          <div className="w-10" />
          <div className="flex-1">Title</div>
          <div className="hidden md:block flex-1">Album</div>
          <div className="w-12" />
          <div className="w-12 text-right">
            <Clock size={16} />
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Track list */}
      <div className="px-4 py-2">
        {songs.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={64} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">No songs yet</h2>
            <p className="text-muted-foreground">
              Add songs to start your library
            </p>
          </div>
        ) : (
          songs.map((song, index) => (
            <SongCard 
              key={song.id} 
              song={song} 
              index={index}
              showIndex
              queue={songs}
              isDeleteMode={isDeleteMode}
            />
          ))
        )}
      </div>
    </div>
  );
}
