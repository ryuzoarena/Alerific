import { SongGridCard } from '@/components/SongCard';
import { PlaylistCoverArt } from '@/components/PlaylistCoverArt';
import { RecentlyPlayedCard } from '@/components/RecentlyPlayedCard';
import { ArtistCard } from '@/components/ArtistCard';
import { AIMixCard } from '@/components/desktop/AIMixCard';
import { DesktopTopNav } from '@/components/desktop/DesktopTopNav';
import { SkeletonGridCards, SkeletonMixCards } from '@/components/desktop/SkeletonCards';
import { HorizontalScroller } from '@/components/desktop/HorizontalScroller';
import { useMusicStore } from '@/stores/musicStore';
import { Music2, TrendingUp, Clock, Sparkles, Library, Mic2 } from 'lucide-react';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useEffect, useMemo, useState } from 'react';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';


interface HomeViewProps {
  isDeleteMode?: boolean;
  onArtistClick?: (artistName: string) => void;
  onAvatarClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  onGetStarted?: () => void;
  onSelectPlaylist?: (id: string) => void;
}

const aiMixes = [
  { title: 'Daylist', description: 'Your personalized mix that changes throughout the day', gradient: 'bg-gradient-to-br from-yellow-600 via-orange-700 to-red-800' },
  { title: 'Hype Getting Ready Mix', description: 'Energy boost for your morning routine', gradient: 'bg-gradient-to-br from-pink-600 via-rose-700 to-red-800' },
  { title: 'Driving Mix', description: 'Perfect playlist for the open road', gradient: 'bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800' },
  { title: 'Chill Mix', description: 'Relax and unwind with calm vibes', gradient: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800' },
  { title: 'Focus Mix', description: 'Deep concentration with ambient sounds', gradient: 'bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800' },
  { title: 'Workout Mix', description: 'High energy tracks to keep you moving', gradient: 'bg-gradient-to-br from-red-600 via-orange-600 to-amber-700' },
];

export function HomeView({ isDeleteMode, onArtistClick, onAvatarClick, isLoggedIn, userName, onGetStarted, onSelectPlaylist }: HomeViewProps) {
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
  

  useEffect(() => {
    if (!songsLoaded) fetchSongs();
  }, [songsLoaded, fetchSongs]);

  useEffect(() => {
    checkAndRefreshRecommendations();
  }, [songs.length, checkAndRefreshRecommendations]);

  const recentlyPlayedSongs = recentlyPlayedIds
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean) as typeof songs;

  const recommendedSongs = dailyRecommendationIds
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean) as typeof songs;

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

  // Mobile filter
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const mobileFilters = [
    { id: 'semua', label: 'Semua' },
    { id: 'musik', label: 'Musik' },
    { id: 'podcast', label: 'Podcast' },
  ];

  // Desktop filter
  const [desktopFilter, setDesktopFilter] = useState<string>('all');

  const isLoading = !songsLoaded;

  return (
    <div className={cn(
      "pb-24 overflow-y-auto h-full",
      // Mobile: time-based gradient
      "lg:bg-transparent",
    )}>
      {/* Desktop Top Nav — only on lg+ */}
      <div className="hidden lg:block">
        <DesktopTopNav
          activeFilter={desktopFilter}
          onFilterChange={setDesktopFilter}
          isLoggedIn={isLoggedIn}
          userName={userName}
          onAvatarClick={onAvatarClick}
          onGetStarted={onGetStarted}
        />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden flex items-center gap-3 mb-4 p-3 sm:p-4">
        {isLoggedIn ? (
          <button
            onClick={onAvatarClick}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#535353]"
          >
            <span className="text-white text-sm font-bold">{userName?.charAt(0).toUpperCase() || 'U'}</span>
          </button>
        ) : (
          <button
            onClick={onGetStarted}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold flex-shrink-0 transition-transform hover:scale-[1.02]",
              timeTheme.accentBg, timeTheme.buttonText
            )}
          >
            Get Started
          </button>
        )}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {mobileFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                activeFilter === f.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-6">
        {/* Greeting */}
        <section className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-white">{timeTheme.greeting}</h1>

          {/* Quick play grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            {playlists.slice(0, 6).map((playlist) => {
              const playlistSongs = songs.filter((s) => playlist.songIds.includes(s.id));
              return (
                <button
                  key={playlist.id}
                  onClick={() => onSelectPlaylist?.(playlist.id)}
                  className="flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden group transition-all duration-200 cursor-pointer"
                >
                  <PlaylistCoverArt
                    playlist={playlist}
                    songs={playlistSongs}
                    size={64}
                    rounded="rounded-none"
                    className="w-14 h-14 lg:w-16 lg:h-16"
                  />
                  <span className="flex-1 px-3 lg:px-4 font-semibold text-sm text-white truncate">{playlist.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* AI Mixes — desktop only */}
        <section className="mb-8 hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">AI Mixes</h2>
            <button className="text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors">
              Show all
            </button>
          </div>
          {isLoading ? (
            <SkeletonMixCards />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {aiMixes.map((mix) => (
                <AIMixCard key={mix.title} {...mix} />
              ))}
            </div>
          )}
        </section>

        {/* Recently Played */}
        {recentlyPlayedSongs.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className={cn("lg:text-white/70", timeTheme.accentColor)} />
                <h2 className="text-xl lg:text-xl font-bold text-white">Recently Played</h2>
              </div>
              <button className="hidden lg:block text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors">
                Show all
              </button>
            </div>
            <div className="space-y-1">
              {recentlyPlayedSongs.map((song) => (
                <RecentlyPlayedCard key={song.id} song={song} queue={recentlyPlayedSongs} />
              ))}
            </div>
          </section>
        )}

        {/* Artists */}
        {artistGroups.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mic2 size={20} className={cn("lg:text-white/70", timeTheme.accentColor)} />
                <h2 className="text-xl font-bold text-white">Your Top Artists</h2>
              </div>
              <button className="hidden lg:block text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors">
                Show all
              </button>
            </div>
            <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
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

        {/* Recommendations */}
        {recommendedSongs.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className={cn("lg:text-white/70", timeTheme.accentColor)} />
                <h2 className="text-xl font-bold text-white">Recommended For You</h2>
              </div>
              <button className="hidden lg:block text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors">
                Show all
              </button>
            </div>
            {isLoading ? (
              <SkeletonGridCards />
            ) : (
              <>
                <HorizontalScroller className="lg:hidden gap-2 sm:gap-3 pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4">
                  {recommendedSongs.map((song) => (
                    <div key={song.id} className="flex-shrink-0 w-28 sm:w-32">
                      <SongGridCard song={song} queue={recommendedSongs} isDeleteMode={isDeleteMode} />
                    </div>
                  ))}
                </HorizontalScroller>
                {/* Desktop: drag-scroll single row, compact cards */}
                <div className="hidden lg:block">
                  <HorizontalScroller className="gap-3 pb-4">
                    {recommendedSongs.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[160px]">
                        <SongGridCard song={song} queue={recommendedSongs} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </HorizontalScroller>
                </div>
              </>
            )}
          </section>
        )}

        {/* Made For You */}
        {madeForYou.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className={cn("lg:text-white/70", timeTheme.accentColor)} />
                <h2 className="text-xl font-bold text-white">Made For You</h2>
              </div>
              <button className="hidden lg:block text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors">
                Show all
              </button>
            </div>
            {isLoading ? (
              <SkeletonGridCards />
            ) : (
              <>
                <HorizontalScroller className="lg:hidden gap-2 sm:gap-3 pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4">
                  {madeForYou.map((song) => (
                    <div key={song.id} className="flex-shrink-0 w-28 sm:w-32">
                      <SongGridCard song={song} queue={madeForYou} isDeleteMode={isDeleteMode} />
                    </div>
                  ))}
                </HorizontalScroller>
                <div className="hidden lg:block">
                  <HorizontalScroller className="gap-3 pb-4">
                    {madeForYou.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[160px]">
                        <SongGridCard song={song} queue={madeForYou} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </HorizontalScroller>
                </div>
              </>
            )}
          </section>
        )}

        {/* All Songs */}
        {songs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Library size={20} className={cn("lg:text-white/70", timeTheme.accentColor)} />
                <h2 className="text-xl font-bold text-white">All Songs</h2>
              </div>
              <button className="hidden lg:block text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors">
                Show all
              </button>
            </div>
            {isLoading ? (
              <SkeletonGridCards />
            ) : (
              <>
                <HorizontalScroller className="lg:hidden gap-3 pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4">
                  {songs.map((song) => (
                    <div key={song.id} className="flex-shrink-0 w-28 sm:w-32">
                      <SongGridCard song={song} queue={songs} isDeleteMode={isDeleteMode} compact />
                    </div>
                  ))}
                </HorizontalScroller>
                <div className="hidden lg:block">
                  <HorizontalScroller className="gap-3 pb-4">
                    {songs.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[160px]">
                        <SongGridCard song={song} queue={songs} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </HorizontalScroller>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
