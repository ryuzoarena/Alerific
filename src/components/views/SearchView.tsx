import { useEffect, useState } from 'react';
import { useMusicStore } from '@/stores/musicStore';
import { SongGridCard } from '@/components/SongCard';
import { SearchBar } from '@/components/SearchBar';
import { Search as SearchIcon, Globe, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPlaylistCoverUrl } from '@/lib/cloudStorage';
import { cn } from '@/lib/utils';

interface SearchViewProps {
  isDeleteMode?: boolean;
  onSelectPlaylist?: (id: string) => void;
}

interface PublicPlaylistResult {
  id: string;
  name: string;
  owner_username: string | null;
  cover_path: string | null;
  song_count: number;
}

export function SearchView({ isDeleteMode, onSelectPlaylist }: SearchViewProps) {
  const { songs, searchQuery } = useMusicStore();
  const [publicPlaylists, setPublicPlaylists] = useState<PublicPlaylistResult[]>([]);

  const filteredSongs = songs.filter((song) => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
    );
  });

  // Search public playlists (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPublicPlaylists([]);
      return;
    }
    const handle = setTimeout(async () => {
      const q = searchQuery.trim();
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, owner_username, cover_path, playlist_songs(count)')
        .eq('is_public', true)
        .or(`name.ilike.%${q}%,owner_username.ilike.%${q}%`)
        .limit(12);
      if (error) {
        console.error('Playlist search error:', error);
        return;
      }
      setPublicPlaylists(
        (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          owner_username: row.owner_username,
          cover_path: row.cover_path,
          song_count: row.playlist_songs?.[0]?.count ?? 0,
        })),
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const noResults = searchQuery && filteredSongs.length === 0 && publicPlaylists.length === 0;

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
            Find your favorite songs, artists, and playlists
          </p>
        </div>
      ) : noResults ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-2">No results found for "{searchQuery}"</h2>
          <p className="text-muted-foreground">Try searching with different keywords</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredSongs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Songs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredSongs.map((song) => (
                  <SongGridCard key={song.id} song={song} queue={filteredSongs} isDeleteMode={isDeleteMode} />
                ))}
              </div>
            </section>
          )}

          {publicPlaylists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {publicPlaylists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlaylist?.(p.id)}
                    className="group text-left rounded-lg p-3 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                  >
                    <div
                      className={cn(
                        'aspect-square rounded mb-3 overflow-hidden flex items-center justify-center',
                        !p.cover_path && 'bg-gradient-to-br from-violet-600 to-fuchsia-500',
                      )}
                    >
                      {p.cover_path ? (
                        <img
                          src={getPlaylistCoverUrl(p.cover_path)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 size={32} className="text-white/80" />
                      )}
                    </div>
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      by {p.owner_username || 'user'} • {p.song_count} songs
                    </p>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-300">
                      <Globe size={10} /> Public
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
