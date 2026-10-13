import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Radio,
  Heart,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock,
  HardDrive,
  ChevronLeft,
  Search,
  Menu,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Download,
  MoreHorizontal,
  Filter,
  Settings,
  ListMusic,
  Upload,
  Trash2,
  LogOut,
  Shield,
} from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { PlaylistCoverArt } from '@/components/PlaylistCoverArt';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { LibraryView } from '@/components/views/LibraryView';
import { SettingsView } from '@/components/views/SettingsView';
import { ArtistView } from '@/components/views/ArtistView';
import { AdminView } from '@/components/views/AdminView';
import { ProfileView } from '@/components/views/ProfileView';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useShellBreakpoint } from '@/hooks/useShellBreakpoint';
import { MobilePlaylistView } from '@/components/views/MobilePlaylistView';
import { cn } from '@/lib/utils';
import type { Song, Playlist } from '@/types/music';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddSongsToPlaylistDialog } from '@/components/AddSongsToPlaylistDialog';

type View = 'home' | 'search' | 'library' | 'playlist' | 'settings' | 'artist' | 'admin' | 'profile';

interface DesktopShellProps {
  activeView: View;
  onViewChange: (v: View) => void;
  selectedPlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  selectedArtist: string;
  onArtistClick: (name: string) => void;
  onAvatarClick: () => void;
  isLoggedIn: boolean;
  userName: string;
  avatarUrl?: string | null;
  onGetStarted: () => void;
  onUploadClick: () => void;
  onCreatePlaylistClick: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  isAdmin: boolean;
  isDeleteMode: boolean;
  onToggleDeleteMode: () => void;
}




const avatarHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

export function DesktopShell(props: DesktopShellProps) {
  const {
    activeView,
    onViewChange,
    selectedPlaylistId,
    onSelectPlaylist,
    selectedArtist,
    onArtistClick,
    onAvatarClick,
    isLoggedIn,
    userName,
    avatarUrl,
    onGetStarted,
    onUploadClick,
    onCreatePlaylistClick,
    onOpenSettings,
    onSignOut,
    isAdmin,
    isDeleteMode,
    onToggleDeleteMode,
  } = props;

  const playlists = useMusicStore((s) => s.playlists);
  const songs = useMusicStore((s) => s.songs);
  const playerState = useMusicStore((s) => s.playerState);
  const togglePlay = useMusicStore((s) => s.togglePlay);
  const nextSong = useMusicStore((s) => s.nextSong);
  const prevSong = useMusicStore((s) => s.prevSong);
  const toggleShuffle = useMusicStore((s) => s.toggleShuffle);
  const toggleRepeat = useMusicStore((s) => s.toggleRepeat);
  const playSong = useMusicStore((s) => s.playSong);
  const setSearchQuery = useMusicStore((s) => s.setSearchQuery);
  const searchQuery = useMusicStore((s) => s.searchQuery);
  const recentlyPlayedIds = useMusicStore((s) => s.recentlyPlayedIds);

  const recentActivity = useMemo(
    () =>
      recentlyPlayedIds
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean)
        .slice(0, 8) as Song[],
    [recentlyPlayedIds, songs],
  );



  const [libOpen, setLibOpen] = useState(true);
  const [plOpen, setPlOpen] = useState(true);
  const [profileMenu, setProfileMenu] = useState(false);
  const { isPhone, isDesktop } = useShellBreakpoint();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(() => window.innerWidth >= 1100);
  useEffect(() => { setShowRightPanel(isDesktop); setShowSidebar(false); }, [isDesktop]);
  useEffect(() => { setShowSidebar(false); }, [activeView, selectedPlaylistId]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchPlaceholders = useMemo(
    () => ['Search songs, artists...', 'Find your next favorite...', 'Discover new playlists...', 'What are you in the mood for?'],
    [],
  );
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  useEffect(() => {
    if (searchFocused || searchQuery) return;
    const id = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % searchPlaceholders.length);
        setPlaceholderVisible(true);
      }, 350);
    }, 3200);
    const categoryNavigation = (
        <div className="flex items-center justify-around px-4 pt-5 pb-3">
          {[
            { id: 'home', label: 'Browse', icon: Compass },
            { id: 'search', label: 'Radio', icon: Radio },
            { id: 'library', label: 'Liked', icon: Heart },
          ].map((it) => {
            const Icon = it.icon;
            const active =
              (it.id === 'home' && activeView === 'home') ||
              (it.id === 'search' && activeView === 'search') ||
              (it.id === 'library' && activeView === 'library');
            return (
              <Button variant="plain" size="plain"
                key={it.id}
                onClick={() => onViewChange(it.id as View)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <span
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    active
                      ? 'bg-foreground text-primary-foreground'
                      : 'bg-shell-top text-muted-foreground group-hover:text-foreground group-hover:bg-secondary',
                  )}
                >
                  <Icon size={17} />
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider',
                    active ? 'text-foreground' : 'text-muted-foreground group-hover:text-muted-foreground',
                  )}
                >
                  {it.label}
                </span>
              </Button>
            );
          })}
        </div>

  );
  const sidebarContent = (
      <aside
        className="ds-surface w-full md:w-[200px] min-[1100px]:w-[230px] shrink-0 flex flex-col border-r h-full min-h-0"
        style={{ background: 'hsl(var(--sidebar))', borderColor: 'hsl(var(--border))' }}
      >
        {/* Top icon nav */}
        {categoryNavigation}

        {/* CTA: Made For You */}
        <div className="px-4 mt-2">
          <Button variant="plain" size="plain"
            onClick={() => {
              if (songs.length === 0) return;
              if (!playerState.shuffle) toggleShuffle();
              const randomIndex = Math.floor(Math.random() * songs.length);
              const randomSong = songs[randomIndex];
              playSong(randomSong, songs);
            }}
            className="ds-play-glow w-full py-2.5 rounded-full text-[13px] font-semibold text-primary-foreground transition-all hover:scale-[1.02]"
            style={{
              background: 'hsl(var(--primary))',
            }}
          >
            Made For You
          </Button>
        </div>

        {/* Lib + Playlists */}
        <div className="flex-1 overflow-y-auto ds-scroll mt-5 px-2">
          {/* YOUR LIBRARY */}
          <Button variant="plain" size="plain"
            onClick={() => setLibOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-muted-foreground hover:text-muted-foreground"
          >
            YOUR LIBRARY
            {libOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </Button>
          {libOpen && (
            <div className="mb-3">
              {[
                { label: 'Recently Played', icon: Clock, onClick: () => onViewChange('home') },
                { label: 'Local Files', icon: HardDrive, onClick: () => onViewChange('library') },

              ].map((it) => {
                const Icon = it.icon;
                return (
                  <Button variant="plain" size="plain"
                    key={it.label}
                    onClick={it.onClick}
                    className="ds-sidebar-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon size={14} />
                    {it.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* PLAYLISTS */}
          <Button variant="plain" size="plain"
            onClick={() => setPlOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-muted-foreground hover:text-muted-foreground"
          >
            PLAYLISTS
            {plOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </Button>
          {plOpen && (
            <div className="mb-3">
              {playlists
                .filter((p) => p.name !== 'Liked Songs')
                .map((p) => {
                const active = activeView === 'playlist' && selectedPlaylistId === p.id;
                return (
                  <Button variant="plain" size="plain"
                    key={p.id}
                    onClick={() => {
                      onSelectPlaylist(p.id);
                      onViewChange('playlist');
                    }}
                    className={cn(
                      'ds-sidebar-item w-full text-left px-3 py-1.5 text-[13px] transition-colors truncate',
                      active ? 'is-active text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {p.name}
                  </Button>
                );
              })}
              {playlists.filter((p) => p.name !== 'Liked Songs').length === 0 && (
                <p className="px-3 py-2 text-[12px] text-muted-foreground">No playlists yet</p>
              )}
            </div>
          )}

          {/* New Playlist */}
          <Button variant="plain" size="plain"
            onClick={onCreatePlaylistClick}
            className="w-full mt-2 mb-4 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground rounded-md transition-colors"
            style={{ border: '1px dashed hsl(var(--border))' }}
          >
            <Plus size={14} /> New Playlist
          </Button>
        </div>

      </aside>
  );
  const rightContent = (
      <aside
        className="ds-surface w-full min-[1100px]:w-[280px] h-full min-h-0 flex flex-col border-l"
        style={{ background: 'hsl(var(--activity))', borderColor: 'hsl(var(--border))' }}
      >
        {/* Profile */}
        <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-2.5 relative">
            <Button variant="plain" size="plain" onClick={onAvatarClick} className="shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-foreground"
                  style={{
                    background: 'hsl(var(--secondary))',
                  }}
                >
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate text-foreground">
                {isLoggedIn ? userName : 'Guest'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Premium</p>
            </div>
            <Button variant="plain" size="plain"
              onClick={onOpenSettings}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings size={14} />
            </Button>
            <Button variant="plain" size="plain"
              onClick={() => setProfileMenu((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown size={14} />
            </Button>
            {profileMenu && (
              <div
                className="absolute top-full right-0 mt-2 w-48 rounded-lg py-1.5 z-10"
                style={{
                  background: 'hsl(var(--shell-top))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              >
                {isLoggedIn ? (
                  <>
                    <Button variant="plain" size="plain"
                      onClick={() => {
                        setProfileMenu(false);
                        onViewChange('profile');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    >
                      <Settings size={12} /> Profile
                    </Button>
                    <Button variant="plain" size="plain"
                      onClick={() => {
                        setProfileMenu(false);
                        onUploadClick();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    >
                      <Upload size={12} /> Upload Song
                    </Button>
                    <Button variant="plain" size="plain"
                      onClick={() => {
                        setProfileMenu(false);
                        onToggleDeleteMode();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    >
                      <Trash2 size={12} /> {isDeleteMode ? 'Exit Delete' : 'Delete Mode'}
                    </Button>
                    {isAdmin && (
                      <Button variant="plain" size="plain"
                        onClick={() => {
                          setProfileMenu(false);
                          onViewChange('admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      >
                        <Shield size={12} /> Admin
                      </Button>
                    )}
                    <div className="my-1 h-px bg-border" />
                    <Button variant="plain" size="plain"
                      onClick={() => {
                        setProfileMenu(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    >
                      <LogOut size={12} /> Sign out
                    </Button>
                  </>
                ) : (
                  <Button variant="plain" size="plain"
                    onClick={() => {
                      setProfileMenu(false);
                      onGetStarted();
                    }}
                    className="w-full text-left px-3 py-2 text-[12px] text-foreground hover:bg-foreground/5"
                  >
                    Sign in
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Listening Activity */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
            LISTENING ACTIVITY
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto ds-scroll px-2 pb-4">
          {recentActivity.length === 0 ? (
            <p className="px-3 py-4 text-[11px] leading-relaxed text-muted-foreground">
              No listening activity yet. Play a song and it will show up here.
            </p>
          ) : (
            recentActivity.map((s) => (
              <Button variant="plain" size="plain"
                key={s.id}
                onClick={() => playSong(s, recentActivity)}
                className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-foreground/[0.03] transition-colors group"
              >
                <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[11px] font-bold text-foreground"
                  style={{
                    background: 'hsl(var(--secondary))',
                  }}
                >
                  {s.coverUrl ? (
                    <img src={s.coverUrl} alt={`${s.title} cover`} className="w-full h-full object-cover" />
                  ) : (
                    s.title.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{s.artist}</p>
                </div>
                <Heart
                  size={12}
                  className="text-muted-foreground group-hover:text-primary transition-colors mt-1"
                />
              </Button>
            ))
          )}
        </div>
      </aside>
  );

  return () => clearInterval(id);
  }, [searchFocused, searchQuery, searchPlaceholders.length]);

  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const playlistSongs = useMemo<Song[]>(
    () =>
      (currentPlaylist?.songIds || [])
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean) as Song[],
    [currentPlaylist?.songIds, songs],
  );

  return (
    <div
      className="ds-root flex flex-1 min-w-0 min-h-0 overflow-hidden text-foreground"
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: 'hsl(var(--background))',
      }}
    >


      {/* ============ LEFT SIDEBAR ============ */}
      <div className="hidden md:flex shrink-0">{sidebarContent}</div>
      <Sheet open={showSidebar && isPhone} onOpenChange={setShowSidebar}>
        <SheetContent side="left" className="shell-overlay p-0 w-[280px] bg-sidebar border-border flex flex-col" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Browse your music</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* ============ MAIN CONTENT ============ */}
      <main
        className="ds-main-surface flex-1 min-w-0 flex flex-col overflow-hidden"
        style={{
          background:
            'var(--shell-gradient)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 pt-3 md:pt-5 pb-3 md:pb-4 shrink-0">
          <Button variant="plain" size="plain" onClick={() => setShowSidebar(true)} aria-label="Open music sidebar" className="md:hidden w-11 h-11 shrink-0 rounded-full bg-secondary text-foreground">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" /> : <Menu size={20} />}
          </Button>
          <Button variant="plain" size="plain"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="hidden md:flex w-11 h-11 rounded-full bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button variant="plain" size="plain"
            onClick={() => window.history.forward()}
            aria-label="Go forward"
            className="hidden md:flex w-11 h-11 rounded-full bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </Button>
          <div className="flex-1 max-w-md mx-auto relative group">
            <Search
              size={14}
              className={cn(
                'absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out',
                searchFocused ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-muted-foreground',
              )}
            />
            <div
              aria-hidden
              className={cn(
                'truncate right-3 pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground transition-all duration-300 ease-out',
                searchQuery || searchFocused
                  ? 'opacity-0 -translate-y-[calc(50%+4px)]'
                  : placeholderVisible
                    ? 'opacity-100'
                    : 'opacity-0 translate-y-[calc(-50%+4px)]',
              )}
            >
              {searchPlaceholders[placeholderIdx]}
            </div>
            <input
              aria-label="Search songs, artists and playlists"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) onViewChange('search');
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'w-full h-11 pl-9 pr-4 py-2 rounded-full text-[12px] text-foreground focus:outline-none transition-all duration-300 ease-out',

              )}
              style={{
                background: searchFocused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                border: searchFocused ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
              }}
            />
          </div>
          <Button variant="plain" size="plain"
            onClick={() => setShowRightPanel((v) => !v)}
            aria-label={showRightPanel ? 'Hide listening activity' : 'Show listening activity'}
            title={showRightPanel ? 'Hide listening activity' : 'Show listening activity'}
            className="w-11 h-11 shrink-0 rounded-full bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ListMusic size={16} />
          </Button>
          <Button variant="plain" size="plain"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="hidden md:flex w-11 h-11 shrink-0 rounded-full bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={16} />
          </Button>

        </div>

        <div className="md:hidden shrink-0 border-b border-border">{categoryNavigation}</div>
        {/* Body */}
        <div className="shell-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden ds-scroll">
          {activeView === 'playlist' && currentPlaylist ? (
            !isDesktop ? <MobilePlaylistView playlistId={selectedPlaylistId} onBack={() => onViewChange('home')} isDeleteMode={isDeleteMode} /> : <PlaylistHeroAndList
              playlist={currentPlaylist}
              songs={playlistSongs}
              onPlayAll={() =>
                playlistSongs.length > 0 && playSong(playlistSongs[0], playlistSongs)
              }
              onPlaySong={(s) => playSong(s, playlistSongs)}
              currentSongId={playerState.currentSong?.id}
              isPlaying={playerState.isPlaying}
              progress={
                playerState.duration > 0
                  ? (playerState.currentTime / playerState.duration) * 100
                  : 0
              }
              onTogglePlay={togglePlay}
              onNext={nextSong}
              onPrev={prevSong}
              shuffle={playerState.shuffle}
              repeat={playerState.repeat}
              onShuffle={toggleShuffle}
              onRepeat={toggleRepeat}
              onShufflePlay={() => {
                if (playlistSongs.length === 0) return;
                if (!playerState.shuffle) toggleShuffle();
                const randomSong = playlistSongs[Math.floor(Math.random() * playlistSongs.length)];
                playSong(randomSong, playlistSongs);
              }}
            />
          ) : (
            <div className="px-2 pt-2">
              {activeView === 'home' && (
                <HomeView
                  isDeleteMode={isDeleteMode}
                  onArtistClick={onArtistClick}
                  onAvatarClick={onAvatarClick}
                  isLoggedIn={isLoggedIn}
                  userName={userName}
                  onGetStarted={onGetStarted}
                  onSelectPlaylist={(id) => {
                    onSelectPlaylist(id);
                    onViewChange('playlist');
                  }}
                />
              )}
              {activeView === 'search' && (
                <SearchView
                  isDeleteMode={isDeleteMode}
                  onSelectPlaylist={async (id) => {
                    await useMusicStore.getState().previewPublicPlaylist(id);
                    onSelectPlaylist(id);
                    onViewChange('playlist');
                  }}
                />
              )}
              {activeView === 'library' && <LibraryView isDeleteMode={isDeleteMode} />}
              {activeView === 'settings' && <SettingsView />}
              {activeView === 'artist' && (
                <ArtistView
                  artistName={selectedArtist}
                  onBack={() => onViewChange('home')}
                  isDeleteMode={isDeleteMode}
                />
              )}
              {activeView === 'admin' && (isAdmin ? <AdminView /> : null)}
              {activeView === 'profile' && (
                <ProfileView
                  onBack={() => onViewChange('home')}
                  userName={userName}
                  avatarUrl={avatarUrl || undefined}
                  onProfileUpdate={() => {}}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* ============ RIGHT PANEL ============ */}
      <div className={cn('hidden min-[1100px]:block shrink-0 overflow-hidden transition-[width,opacity] duration-300', showRightPanel ? 'w-[280px]' : 'w-0 opacity-0')}>{rightContent}</div>
      <Sheet open={showRightPanel && !isDesktop} onOpenChange={setShowRightPanel}>
        <SheetContent side={isPhone ? 'bottom' : 'right'} className={cn('shell-overlay p-0 bg-activity border-border flex flex-col', isPhone ? 'h-[75dvh] rounded-t-lg' : 'w-[320px] h-dvh')} aria-describedby={undefined}>
          <SheetTitle className="sr-only">Profile and Listening Activity</SheetTitle>
          {rightContent}
        </SheetContent>
      </Sheet>
    </div>

  );
}

// ===================== Hero + Song List =====================
interface HeroProps {
  playlist: Playlist;
  songs: Song[];
  onPlayAll: () => void;
  onPlaySong: (s: Song) => void;
  currentSongId?: string;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  onShuffle: () => void;
  onRepeat: () => void;
  onShufflePlay: () => void;
}

function fmtAgo(ts: number) {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  return m === 1 ? '1 month ago' : `${m} months ago`;
}

function totalDuration(songs: Song[]) {
  const total = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

function PlaylistHeroAndList(props: HeroProps) {
  const {
    playlist,
    songs,
    onPlayAll,
    onPlaySong,
    currentSongId,
    isPlaying,
    progress,
    onTogglePlay,
    onNext,
    onPrev,
    shuffle,
    repeat,
    onShuffle,
    onRepeat,
    onShufflePlay,
  } = props;
  const [showAddSongs, setShowAddSongs] = useState(false);

  return (
    <div className="px-6">
      <AddSongsToPlaylistDialog
        isOpen={showAddSongs}
        onClose={() => setShowAddSongs(false)}
        playlistId={playlist.id}
      />
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6"
        style={{
          background: 'hsl(var(--shell-top))',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Atmospheric bg */}
        <div className="absolute inset-0">
          {playlist.coverUrl || songs[0]?.coverUrl ? (
            <img
              src={playlist.coverUrl || songs[0]?.coverUrl}
              alt=""
              className="w-full h-full object-cover scale-110"
              style={{ filter: 'blur(24px) brightness(0.55)' }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  'var(--shell-gradient)',
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--background)) 0%, rgba(13,17,23,0.85) 40%, rgba(13,17,23,0.4) 100%)',
            }}
          />
        </div>

        <div className="relative p-8 flex items-end gap-8 min-h-[280px]">
          <div className="shrink-0 hidden md:block">
            <div
              className="rounded-xl overflow-hidden"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
            >
              <PlaylistCoverArt
                playlist={playlist}
                songs={songs}
                size={180}
                rounded="rounded-xl"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground mb-3">
              PLAYLIST
            </p>
            <h1
              className="ds-display text-5xl font-extrabold text-foreground mb-2 truncate"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
            >
              {playlist.name}
            </h1>
            <p className="text-[14px] text-muted-foreground mb-3 truncate">
              {playlist.description || 'Forget the traffic stress.'}
            </p>
            <p className="text-[12px] text-muted-foreground mb-5">
              Created by{' '}
              <span className="text-foreground font-medium">
                {playlist.owner_username || 'Alerify'}
              </span>{' '}
              • {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              {songs.length > 0 && <> , {totalDuration(songs)}</>}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="plain" size="plain"
                onClick={onPlayAll}
                disabled={songs.length === 0}
                className="ds-play-glow px-7 py-2.5 rounded-full text-[12px] font-bold tracking-[0.15em] text-primary-foreground transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  background: 'hsl(var(--primary))',
                }}
              >
                PLAY
              </Button>
              <Button variant="plain" size="plain"
                onClick={onShufflePlay}
                disabled={songs.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[12px] font-bold tracking-[0.15em] text-foreground transition-all hover:bg-foreground/5 disabled:opacity-40 disabled:hover:scale-100"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <Shuffle size={15} /> SHUFFLE
              </Button>
              <Button variant="plain" size="plain" className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                <Download size={15} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="plain" size="plain" className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                    <MoreHorizontal size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-shell-top border-border/10 text-foreground">
                  <DropdownMenuItem onClick={() => setShowAddSongs(true)} className="cursor-pointer focus:bg-foreground/10 focus:text-foreground">
                    <Plus size={14} className="mr-2" /> Add songs to playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Filter + Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <Button variant="plain" size="plain" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
          <Filter size={12} /> Filter
        </Button>
        <div className="flex items-center gap-8 pr-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground hidden md:block w-40">
            ARTIST
          </span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-1">
            <Download size={10} /> DOWNLOAD
          </span>
        </div>
      </div>
      <div
        className="h-px mb-2"
        style={{ background: 'hsl(var(--border))' }}
      />

      {/* Rows */}
      <div>
        {songs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-[13px]">
            No songs in this playlist yet.
          </div>
        ) : (
          songs.map((song) => {
            const isCurrent = song.id === currentSongId;
            return (
              <div
                key={song.id}
                onDoubleClick={() => onPlaySong(song)}
                className="ds-song-row grid grid-cols-[24px_24px_1fr_180px_90px_24px] items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
              >
                <Button variant="plain" size="plain" className="text-muted-foreground hover:text-primary transition-colors">
                  <Plus size={14} />
                </Button>
                <Button variant="plain" size="plain"
                  onClick={() => onPlaySong(song)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </Button>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'ds-song-title text-[13px] font-medium truncate transition-colors',
                      isCurrent ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {song.title}
                  </p>
                </div>
                <p className="text-[12px] text-muted-foreground truncate hidden md:block">
                  {song.artist}
                </p>
                <p className="text-[11px] text-muted-foreground">{fmtAgo(song.addedAt)}</p>
                <Button variant="plain" size="plain" className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal size={14} />
                </Button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
