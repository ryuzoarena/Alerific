import { SongGridCard } from '@/components/SongCard';
import { RecentlyPlayedCard } from '@/components/RecentlyPlayedCard';
import { useMusicStore } from '@/stores/musicStore';
import { Music2, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useEffect, useState } from 'react';

interface HomeViewProps {
  isDeleteMode?: boolean;
}

export function HomeView({ isDeleteMode }: HomeViewProps) {
  const { 
    songs, 
    playlists, 
    playSong, 
    recentlyPlayedIds, 
    loadSongMedia,
    dailyRecommendationIds,
    checkAndRefreshRecommendations 
  } = useMusicStore();
  const timeTheme = useTimeTheme();
  const [recentlyPlayedSongs, setRecentlyPlayedSongs] = useState<typeof songs>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<typeof songs>([]);

  // Check and refresh daily recommendations on mount and when songs change
  useEffect(() => {
    checkAndRefreshRecommendations();
  }, [songs.length, checkAndRefreshRecommendations]);

  // Load recently played songs with their media
  useEffect(() => {
    const loadRecentSongs = async () => {
      const loaded = await Promise.all(
        recentlyPlayedIds.map(async (id) => {
          const song = songs.find(s => s.id === id);
          if (!song) return null;
          
          const media = await loadSongMedia(id);
          return media ? { ...song, coverUrl: media.coverUrl } : song;
        })
      );
      setRecentlyPlayedSongs(loaded.filter(Boolean) as typeof songs);
    };
    
    loadRecentSongs();
  }, [recentlyPlayedIds, songs, loadSongMedia]);

  // Load recommended songs with their media
  useEffect(() => {
    const loadRecommendedSongs = async () => {
      const loaded = await Promise.all(
        dailyRecommendationIds.map(async (id) => {
          const song = songs.find(s => s.id === id);
          if (!song) return null;
          
          const media = await loadSongMedia(id);
          return media ? { ...song, coverUrl: media.coverUrl } : song;
        })
      );
      setRecommendedSongs(loaded.filter(Boolean) as typeof songs);
    };
    
    loadRecommendedSongs();
  }, [dailyRecommendationIds, songs, loadSongMedia]);

  // Made for you = all songs (newest first)
  const madeForYou = [...songs].reverse().slice(0, 6);

  return (
    <div className={`p-3 sm:p-4 md:p-6 pb-24 overflow-y-auto h-full bg-gradient-to-b theme-transition ${timeTheme.gradient}`}>
      {/* Greeting */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-6">{timeTheme.greeting}</h1>
        
        {/* Quick access grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((playlist) => {
            const playlistSongs = songs.filter(s => playlist.songIds.includes(s.id));
            const coverUrl = playlistSongs[0]?.coverUrl;
            
            return (
              <button
                key={playlist.id}
                className="flex items-center bg-card/60 hover:bg-card rounded-md overflow-hidden group transition-colors"
              >
                <div className="w-16 h-16 bg-secondary flex-shrink-0">
                  {coverUrl ? (
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br theme-transition ${timeTheme.accentBg}/50 to-${timeTheme.accentBg}/20 flex items-center justify-center`}>
                      <Music2 className={`theme-transition ${timeTheme.accentColor}`} />
                    </div>
                  )}
                </div>
                <span className="flex-1 px-4 font-semibold text-sm truncate">
                  {playlist.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Recommendations */}
      {recommendedSongs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">Recommendation for a Fresh New Day</h2>
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

      {/* Recently Played - List Layout (max 3) */}
      {recentlyPlayedSongs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className={`theme-transition ${timeTheme.accentColor}`} />
            <h2 className="text-xl sm:text-2xl font-bold">Recently Played</h2>
          </div>
          <div className="space-y-1">
            {recentlyPlayedSongs.map((song) => (
              <RecentlyPlayedCard 
                key={song.id} 
                song={song} 
                queue={recentlyPlayedSongs} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Made for you - all uploaded songs */}
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
    </div>
  );
}

