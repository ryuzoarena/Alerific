import { SongGridCard } from '@/components/SongCard';
import { useMusicStore } from '@/stores/musicStore';
import { Music2, TrendingUp, Clock } from 'lucide-react';

export function HomeView() {
  const { songs, playlists, playSong } = useMusicStore();

  const recentlyPlayed = songs.slice(0, 6);
  const topMixes = songs.slice().reverse().slice(0, 6);

  return (
    <div className="p-6 pb-24 overflow-y-auto h-full">
      {/* Greeting */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Good evening</h1>
        
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
                    <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                      <Music2 className="text-primary" />
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
          <Clock size={20} className="text-muted-foreground" />
          <h2 className="text-2xl font-bold">Recently Played</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {recentlyPlayed.map((song) => (
            <SongGridCard key={song.id} song={song} queue={recentlyPlayed} />
          ))}
        </div>
      </section>

      {/* Made for you */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-muted-foreground" />
          <h2 className="text-2xl font-bold">Made For You</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {topMixes.map((song) => (
            <SongGridCard key={song.id} song={song} queue={topMixes} />
          ))}
        </div>
      </section>

      {/* All songs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Music2 size={20} className="text-muted-foreground" />
          <h2 className="text-2xl font-bold">Your Music</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {songs.map((song) => (
            <SongGridCard key={song.id} song={song} queue={songs} />
          ))}
        </div>
      </section>
    </div>
  );
}
