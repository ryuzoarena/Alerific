import { SongGridCard } from '@/components/SongCard';
import { useMusicStore } from '@/stores/musicStore';
import { Music2, TrendingUp, Clock } from 'lucide-react';
import { useTimeTheme } from '@/hooks/useTimeTheme';

interface HomeViewProps {
  isDeleteMode?: boolean;
}

export function HomeView({ isDeleteMode }: HomeViewProps) {
  const { songs, playlists, playSong } = useMusicStore();
  const timeTheme = useTimeTheme();

  const recentlyPlayed = songs.slice(0, 6);
  const topMixes = songs.slice().reverse().slice(0, 6);

  return (
    <div className={`p-3 sm:p-4 md:p-6 pb-24 overflow-y-auto h-full bg-gradient-to-b ${timeTheme.gradient}`}>
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
                    <div className={`w-full h-full bg-gradient-to-br ${timeTheme.accentBg}/50 to-${timeTheme.accentBg}/20 flex items-center justify-center`}>
                      <Music2 className={timeTheme.accentColor} />
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

      {/* Recently played */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className={timeTheme.accentColor} />
          <h2 className="text-xl sm:text-2xl font-bold">Recently Played</h2>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:gap-4">
          {recentlyPlayed.map((song) => (
            <div key={song.id} className="flex-shrink-0 w-28 sm:w-32 md:w-auto">
              <SongGridCard song={song} queue={recentlyPlayed} isDeleteMode={isDeleteMode} />
            </div>
          ))}
        </div>
      </section>

      {/* Made for you */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className={timeTheme.accentColor} />
          <h2 className="text-xl sm:text-2xl font-bold">Made For You</h2>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:gap-4">
          {topMixes.map((song) => (
            <div key={song.id} className="flex-shrink-0 w-28 sm:w-32 md:w-auto">
              <SongGridCard song={song} queue={topMixes} isDeleteMode={isDeleteMode} />
            </div>
          ))}
        </div>
      </section>

      {/* All songs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Music2 size={20} className={timeTheme.accentColor} />
          <h2 className="text-xl sm:text-2xl font-bold">Your Music</h2>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:gap-4">
          {songs.map((song) => (
            <div key={song.id} className="flex-shrink-0 w-28 sm:w-32 md:w-auto">
              <SongGridCard song={song} queue={songs} isDeleteMode={isDeleteMode} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
