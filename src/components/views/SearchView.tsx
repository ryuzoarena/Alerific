import { useMusicStore } from '@/stores/musicStore';
import { SongGridCard } from '@/components/SongCard';
import { SearchBar } from '@/components/SearchBar';
import { Search as SearchIcon } from 'lucide-react';

interface SearchViewProps {
  isDeleteMode?: boolean;
}

export function SearchView({ isDeleteMode }: SearchViewProps) {
  const { songs, searchQuery } = useMusicStore();

  const filteredSongs = songs.filter(song => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 pb-24 overflow-y-auto h-full">
      <div className="mb-8">
        <SearchBar />
      </div>

      {!searchQuery ? (
        <div className="text-center py-20">
          <SearchIcon size={64} className="mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Search for music</h2>
          <p className="text-muted-foreground">
            Find your favorite songs, artists, and albums
          </p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-2">No results found for "{searchQuery}"</h2>
          <p className="text-muted-foreground">
            Try searching with different keywords
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4">
            Results for "{searchQuery}"
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredSongs.map((song) => (
              <SongGridCard key={song.id} song={song} queue={filteredSongs} isDeleteMode={isDeleteMode} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
