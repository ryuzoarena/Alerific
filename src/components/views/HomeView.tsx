import { SongGridCard } from '@/components/SongCard';
import { PlaylistCoverArt } from '@/components/PlaylistCoverArt';
import { RecentlyPlayedCard } from '@/components/RecentlyPlayedCard';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/button';
import { musicCategories } from '@/components/desktop/musicCategories';
import { AIMixCard } from '@/components/desktop/AIMixCard';
import { DesktopTopNav } from '@/components/desktop/DesktopTopNav';
import { SkeletonGridCards, SkeletonMixCards } from '@/components/desktop/SkeletonCards';
import { HorizontalScroller } from '@/components/desktop/HorizontalScroller';
import { useMusicStore } from '@/stores/musicStore';
import { Music2, TrendingUp, Clock, Sparkles, Library, Mic2, Loader2 } from 'lucide-react';
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

  const [showAllArtists, setShowAllArtists] = useState(() => {
    try {
      return localStorage.getItem('alerify-show-all-artists') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('alerify-show-all-artists', String(showAllArtists));
    } catch {
      /* ignore */
    }
  }, [showAllArtists]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setExpandedSections(v => ({ ...v, [id]: !v[id] }));
  const isLoading = !songsLoaded;


  return (
    <div className={cn(
      "pb-6 min-w-0",
      // Mobile: time-based gradient
      "lg:bg-transparent",
    )}>

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-6">
        {/* Greeting */}
        <section className="mb-6 lg:mb-8">
          <h1 className="sr-only">Alerify — stream and manage your personal music collection</h1>
          <p aria-hidden="true" className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-foreground">{timeTheme.greeting}</p>

          {/* Quick play grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            {playlists.slice(0, 6).map((playlist) => {
              const playlistSongs = songs.filter((s) => playlist.songIds.includes(s.id));
              return (
                <Button variant="plain" size="plain"
                  key={playlist.id}
                  onClick={() => onSelectPlaylist?.(playlist.id)}
                  className="min-w-0 flex items-center bg-foreground/5 hover:bg-foreground/10 rounded-md overflow-hidden group transition-all duration-200 cursor-pointer"
                >
                  <PlaylistCoverArt
                    playlist={playlist}
                    songs={playlistSongs}
                    size={64}
                    rounded="rounded-none"
                    className="w-14 h-14 lg:w-16 lg:h-16"
                  />
                  <span className="min-w-0 flex-1 px-2 lg:px-4 font-semibold text-sm text-foreground truncate">{playlist.name}</span>
                </Button>
              );
            })}
          </div>
        </section>

        {/* AI Mixes — desktop only */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">AI Mixes</h2>
            <Button variant="plain" size="plain" onClick={() => toggleSection('mixes')} aria-expanded={!!expandedSections.mixes} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              {expandedSections.mixes ? 'Show less' : 'Show all'}
            </Button>
          </div>
          {isLoading ? (
            <SkeletonMixCards />
          ) : (
            {expandedSections.mixes ? <div className="grid grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-4 gap-3 pb-4">
              {musicCategories.map((mix) => (
                <AIMixCard key={mix.title} {...mix} onClick={() => {
                  const state = useMusicStore.getState();
                  if (!songs.length) return;
                  if (!state.playerState.shuffle) state.toggleShuffle();
                  state.playSong(songs[Math.floor(Math.random() * songs.length)], songs);
                }} />
              ))}
            </div> : <HorizontalScroller className="gap-3 pb-2">
              {musicCategories.map((mix) => (
                <AIMixCard key={mix.title} {...mix} onClick={() => {
                  const state = useMusicStore.getState();
                  if (!songs.length) return;
                  if (!state.playerState.shuffle) state.toggleShuffle();
                  state.playSong(songs[Math.floor(Math.random() * songs.length)], songs);
                }} />
              ))}
            </HorizontalScroller>}
          )}
        </section>

        {/* Recently Played */}
        {recentlyPlayedSongs.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-foreground/70" />
                <h2 className="text-xl lg:text-xl font-bold text-foreground">Recently Played</h2>
              </div>
              <Button variant="plain" size="plain" onClick={() => toggleSection('recent')} aria-expanded={!!expandedSections.recent} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {expandedSections.recent ? 'Show less' : 'Show all'}
              </Button>
            </div>
            <div className="space-y-1">
              {recentlyPlayedSongs.map((song) => (
                <RecentlyPlayedCard key={song.id} song={song} queue={recentlyPlayedSongs} />
              ))}
            </div>
          </section>
        )}

        {/* Artists */}
        {(isLoading || artistGroups.length > 0) && (
          <section className="mb-6 lg:mb-8" aria-busy={isLoading}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mic2 size={20} className="text-foreground/70" />
                <h2 id="top-artists-heading" className="text-xl font-bold text-foreground">Your Top Artists</h2>
              </div>
              <Button variant="plain" size="plain"
                type="button"
                onClick={() => setShowAllArtists((v) => !v)}
                aria-expanded={showAllArtists}
                aria-controls="top-artists-panel"
                aria-label={showAllArtists ? 'Show fewer artists' : 'Show all artists'}
                disabled={isLoading || artistGroups.length === 0}
                className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 disabled:hover:text-muted-foreground"
              >
                {showAllArtists ? 'Show less' : 'Show all'}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 py-10 text-foreground/70" role="status">
                <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                <span className="text-sm">Loading artists…</span>
              </div>
            ) : artistGroups.length === 0 ? (
              <div className="rounded-lg border border-border/10 bg-foreground/5 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">No artists yet</p>
                <p className="mt-1 text-sm text-foreground/60">
                  Upload at least two songs by the same artist and they’ll show up here.
                </p>
              </div>
            ) : (
              <div
                id="top-artists-panel"
                aria-labelledby="top-artists-heading"
                key={showAllArtists ? 'grid' : 'row'}
                className={cn(
                  "animate-fade-in transition-all duration-300 ease-out",
                  showAllArtists
                    ? "grid grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-4 gap-4 sm:gap-5 pb-4"
                    : "songs-scroll-container flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                )}
              >
                {artistGroups.map(([artistName, artistSongs]) => (
                  <ArtistCard
                    key={artistName}
                    artistName={artistName}
                    songs={artistSongs}
                    onClick={() => onArtistClick?.(artistName)}
                  />
                ))}
              </div>
            )}
          </section>
        )}


        {/* Recommendations */}
        {recommendedSongs.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-foreground/70" />
                <h2 className="text-xl font-bold text-foreground">Recommended For You</h2>
              </div>
              <Button variant="plain" size="plain" onClick={() => toggleSection('recommended')} aria-expanded={!!expandedSections.recommended} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {expandedSections.recommended ? 'Show less' : 'Show all'}
              </Button>
            </div>
            {isLoading ? (
              <SkeletonGridCards />
            ) : (
              <>
                {expandedSections.recommended ? <div className="grid grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-4 gap-3 pb-4">
                    {recommendedSongs.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[150px] md:w-[160px]">
                        <SongGridCard song={song} queue={recommendedSongs} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </div> : <HorizontalScroller className="gap-3 pb-4">
                    {recommendedSongs.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[150px] md:w-[160px]">
                        <SongGridCard song={song} queue={recommendedSongs} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </HorizontalScroller>}
              </>
            )}
          </section>
        )}

        {/* Made For You */}
        {madeForYou.length > 0 && (
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-foreground/70" />
                <h2 className="text-xl font-bold text-foreground">Made For You</h2>
              </div>
              <Button variant="plain" size="plain" onClick={() => toggleSection('made')} aria-expanded={!!expandedSections.made} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {expandedSections.made ? 'Show less' : 'Show all'}
              </Button>
            </div>
            {isLoading ? (
              <SkeletonGridCards />
            ) : (
              <>
                {expandedSections.made ? <div className="grid grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-4 gap-3 pb-4">
                    {madeForYou.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[150px] md:w-[160px]">
                        <SongGridCard song={song} queue={madeForYou} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </div> : <HorizontalScroller className="gap-3 pb-4">
                    {madeForYou.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[150px] md:w-[160px]">
                        <SongGridCard song={song} queue={madeForYou} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </HorizontalScroller>}
              </>
            )}
          </section>
        )}

        {/* All Songs */}
        {songs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Library size={20} className="text-foreground/70" />
                <h2 className="text-xl font-bold text-foreground">All Songs</h2>
              </div>
              <Button variant="plain" size="plain" onClick={() => toggleSection('all')} aria-expanded={!!expandedSections.all} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {expandedSections.all ? 'Show less' : 'Show all'}
              </Button>
            </div>
            {isLoading ? (
              <SkeletonGridCards />
            ) : (
              <>
                {expandedSections.all ? <div className="grid grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-4 gap-3 pb-4">
                    {songs.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[150px] md:w-[160px]">
                        <SongGridCard song={song} queue={songs} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </div> : <HorizontalScroller className="gap-3 pb-4">
                    {songs.map((song) => (
                      <div key={song.id} className="flex-shrink-0 w-[150px] md:w-[160px]">
                        <SongGridCard song={song} queue={songs} isDeleteMode={isDeleteMode} compact />
                      </div>
                    ))}
                  </HorizontalScroller>}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
