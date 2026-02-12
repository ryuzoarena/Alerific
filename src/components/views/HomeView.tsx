import { SongGridCard } from '@/components/SongCard';
import { RecentlyPlayedCard } from '@/components/RecentlyPlayedCard';
import { ArtistCard } from '@/components/ArtistCard';
import { useMusicStore } from '@/stores/musicStore';
import { Music2, TrendingUp, Clock, Sparkles, Library, Mic2 } from 'lucide-react';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useEffect, useMemo } from 'react';
import { Song } from '@/types/music';

interface HomeViewProps {
  isDeleteMode?: boolean;
  onArtistClick?: (artistName: string) => void;
}

export function HomeView({ isDeleteMode, onArtistClick }: HomeViewProps) {
  const { 
    songs, 
    playlists, 
    recentlyPlayedIds, 
    dailyRecommendationIds,
    checkAndRefreshRecommendations,
    fetchSongs,
    songsLoaded,
  } = useMusicStore();
  const timeTheme = useTimeTheme();

  // Fetch songs from cloud on mount
  useEffect(() => {
    if (!songsLoaded) fetchSongs();
  }, [songsLoaded, fetchSongs]);

  // Check and refresh daily recommendations
  useEffect(() => {
    checkAndRefreshRecommendations();
  }, [songs.length, checkAndRefreshRecommendations]);

  const recentlyPlayedSongs = recentlyPlayedIds
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean) as typeof songs;

  const recommendedSongs = dailyRecommendationIds
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean) as typeof songs;

  // Group songs by artist (only artists with 2+ songs)
  const artistGroups = useMemo(() => {
    const groups: Record<string, Song[]> = {};
    songs.forEach(song => {
      const artist = song.artist;
      if (!groups[artist]) groups[artist] = [];
      groups[artist].push(song);
    });
    return Object.entries(groups)
      .filter(([, songs]) => songs.length >= 2)
      .sort((a, b) => b[1].length - a[1].length);
  }, [songs]);

  const madeForYou = songs.slice(0, 6);

  return (
    <div className={`p-3 sm:p-4 md:p-6 pb-24 overflow-y-auto h-full bg-gradient-to-b theme-transition ${timeTheme.gradient}`}>
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-6">{timeTheme.greeting}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((playlist) => {
            const playlistSongs = songs.filter(s => playlist.songIds.includes(s.id));
            const coverUrl = playlistSongs[0]?.coverUrl;
            return (
              <button key={playlist.id} className="flex items-center bg-card/60 hover:bg-card rounded-md overflow-hidden group transition-colors">
                <div className="w-16 h-16 bg-secondary flex-shrink-0">
                  {coverUrl ? (
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br theme-transition ${timeTheme.accentBg}/50 to-${timeTheme.accentBg}/20 flex items-center justify-center`}>
                      <Music2 className={`theme-transition ${timeTheme.accentColor}`} />
                    </div>
                  )}
                </div>
                <span className="flex-1 px-4 font-semibold text-sm truncate">{playlist.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {recentlyPlayedSongs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">Recently Played</h2>
          </div>
          <div className="space-y-1">
            {recentlyPlayedSongs.map((song) => (
              <RecentlyPlayedCard key={song.id} song={song} queue={recentlyPlayedSongs} />
            ))}
          </div>
        </section>
      )}

      {artistGroups.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Mic2 size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">Artis Favoritmu</h2>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
            {artistGroups.map(([artistName, artistSongs]) => (
              <ArtistCard
                key={artistName}
                artistName={artistName}
                songs={artistSongs}
                onClick={() => onArtistClick?.(artistName)}
              />
            ))}
          </div>
        </section>
      )}

      {recommendedSongs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">Recommendation For a Fresh New Day</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:gap-4">
            {recommendedSongs.map((song) => (
              <div key={song.id} className="flex-shrink-0 w-28 sm:w-32 md:w-auto">
                <SongGridCard song={song} queue={recommendedSongs} isDeleteMode={isDeleteMode} />
              </div>
            ))}
          </div>
        </section>
      )}

      {madeForYou.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">Made For You</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:gap-4">
            {madeForYou.map((song) => (
              <div key={song.id} className="flex-shrink-0 w-28 sm:w-32 md:w-auto">
                <SongGridCard song={song} queue={madeForYou} isDeleteMode={isDeleteMode} />
              </div>
            ))}
          </div>
        </section>
      )}

      {songs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Library size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">All Songs</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:gap-4">
            {songs.map((song) => (
              <div key={song.id} className="flex-shrink-0 w-28 sm:w-32 md:w-auto">
                <SongGridCard song={song} queue={songs} isDeleteMode={isDeleteMode} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
