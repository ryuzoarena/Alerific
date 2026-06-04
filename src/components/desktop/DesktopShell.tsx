import { useMemo, useState } from 'react';
import {
  Compass,
  Radio,
  Heart,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock,
  Mic2,
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
import { cn } from '@/lib/utils';
import type { Song, Playlist } from '@/types/music';

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

const friendActivity = [
  { name: 'Polen Merida', song: 'Midnight City', artist: 'M83', playlist: 'Sunday Moodz' },
  { name: 'Rosie Clever', song: 'Electric Feel', artist: 'MGMT', playlist: 'Discover Weekly' },
  { name: 'Koray Secgin', song: 'Redbone', artist: 'Childish Gambino', playlist: 'Coffee House' },
  { name: 'Didem Sorian', song: 'Adore You', artist: 'Harry Styles', playlist: 'Drive Loud' },
  { name: 'Eren Aksoy', song: 'Blinding Lights', artist: 'The Weeknd', playlist: '90\'s Popular' },
];

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

  const [libOpen, setLibOpen] = useState(true);
  const [plOpen, setPlOpen] = useState(true);
  const [profileMenu, setProfileMenu] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

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
      className="hidden min-[1100px]:flex flex-1 min-h-0 overflow-hidden text-white"
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: '#0d1117',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .ds-display { font-family: 'Outfit', 'DM Sans', system-ui, sans-serif; letter-spacing: -0.02em; }
        .ds-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .ds-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .ds-scroll::-webkit-scrollbar-thumb:hover { background: rgba(29,185,84,0.4); }
        .ds-sidebar-item { position: relative; }
        .ds-sidebar-item::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
          width: 2px; height: 60%; background: #1DB954; border-radius: 2px;
          transition: transform 180ms ease; transform-origin: center;
        }
        .ds-sidebar-item:hover::before, .ds-sidebar-item.is-active::before { transform: translateY(-50%) scaleY(1); }
        .ds-play-glow:hover { box-shadow: 0 0 24px #1DB95480, 0 0 60px #1DB95430; }
        .ds-song-row:hover { background: rgba(255,255,255,0.04); }
        .ds-song-row:hover .ds-song-title { color: #1DB954; }
        @keyframes dsPulse { 0%,100% { box-shadow: 0 0 0 0 #1DB95480; } 50% { box-shadow: 0 0 0 6px #1DB95400; } }
        .ds-dot-pulse { animation: dsPulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* ============ LEFT SIDEBAR ============ */}
      <aside
        className="w-[230px] shrink-0 flex flex-col border-r"
        style={{ background: '#111318', borderColor: '#1e2530' }}
      >
        {/* Top icon nav */}
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
              <button
                key={it.id}
                onClick={() => onViewChange(it.id as View)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <span
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    active
                      ? 'bg-white text-black'
                      : 'bg-[#1a2035] text-[#8896a4] group-hover:text-white group-hover:bg-[#222a3d]',
                  )}
                >
                  <Icon size={17} />
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider',
                    active ? 'text-white' : 'text-[#4a5568] group-hover:text-[#8896a4]',
                  )}
                >
                  {it.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA: Made For You */}
        <div className="px-4 mt-2">
          <button
            onClick={() => onViewChange('home')}
            className="ds-play-glow w-full py-2.5 rounded-full text-[13px] font-semibold text-black transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #1DB954 0%, #17a349 100%)',
              boxShadow: '0 4px 14px #1DB95440',
            }}
          >
            Made For You
          </button>
        </div>

        {/* Lib + Playlists */}
        <div className="flex-1 overflow-y-auto ds-scroll mt-5 px-2">
          {/* YOUR LIBRARY */}
          <button
            onClick={() => setLibOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-[#4a5568] hover:text-[#8896a4]"
          >
            YOUR LIBRARY
            {libOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {libOpen && (
            <div className="mb-3">
              {[
                { label: 'Recently Played', icon: Clock, onClick: () => onViewChange('home') },
                { label: 'Podcasts', icon: Mic2, onClick: () => onViewChange('library') },
                { label: 'Local Files', icon: HardDrive, onClick: () => onViewChange('library') },
              ].map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.label}
                    onClick={it.onClick}
                    className="ds-sidebar-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#8896a4] hover:text-white transition-colors"
                  >
                    <Icon size={14} />
                    {it.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* PLAYLISTS */}
          <button
            onClick={() => setPlOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-[#4a5568] hover:text-[#8896a4]"
          >
            PLAYLISTS
            {plOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {plOpen && (
            <div className="mb-3">
              {playlists.map((p) => {
                const active = activeView === 'playlist' && selectedPlaylistId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPlaylist(p.id);
                      onViewChange('playlist');
                    }}
                    className={cn(
                      'ds-sidebar-item w-full text-left px-3 py-1.5 text-[13px] transition-colors truncate',
                      active ? 'is-active text-white' : 'text-[#8896a4] hover:text-white',
                    )}
                  >
                    {p.name}
                  </button>
                );
              })}
              {playlists.length === 0 && (
                <p className="px-3 py-2 text-[12px] text-[#4a5568]">No playlists yet</p>
              )}
            </div>
          )}

          {/* New Playlist */}
          <button
            onClick={onCreatePlaylistClick}
            className="w-full mt-2 mb-4 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-[#8896a4] hover:text-white rounded-md transition-colors"
            style={{ border: '1px dashed #1e2530' }}
          >
            <Plus size={14} /> New Playlist
          </button>
        </div>

        {/* Now Playing (sidebar mini) */}
        <div
          className="px-3 py-3 border-t flex items-center gap-2.5"
          style={{ borderColor: '#1e2530', background: '#0e1117' }}
        >
          <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-[#1a2035] flex items-center justify-center">
            {playerState.currentSong?.coverUrl ? (
              <img
                src={playerState.currentSong.coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <ListMusic size={14} className="text-[#4a5568]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold truncate text-white">
              {playerState.currentSong?.title || 'Nothing playing'}
            </p>
            <p className="text-[10px] text-[#8896a4] truncate">
              {playerState.currentSong?.artist || '—'}
            </p>
          </div>
          <Heart
            size={14}
            className="text-[#8896a4] hover:text-[#1DB954] cursor-pointer transition-colors"
          />
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main
        className="flex-1 min-w-0 flex flex-col overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #1a2035 0%, #0d1117 60%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 shrink-0">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-[#8896a4] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-[#8896a4] hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <div className="flex-1 max-w-md mx-auto relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5568]"
            />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) onViewChange('search');
              }}
              placeholder="Search songs, artists..."
              className="w-full pl-9 pr-4 py-2 rounded-full text-[12px] text-white placeholder:text-[#4a5568] focus:outline-none focus:ring-1 focus:ring-[#1DB954]/40"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #1e2530',
              }}
            />
          </div>
          <button
            onClick={() => setShowRightPanel((v) => !v)}
            title={showRightPanel ? 'Hide friend activity' : 'Show friend activity'}
            className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-[#8896a4] hover:text-white transition-colors"
          >
            <ListMusic size={16} />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-[#8896a4] hover:text-white transition-colors"
          >
            <Menu size={16} />
          </button>

        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto ds-scroll pb-32">
          {activeView === 'playlist' && currentPlaylist ? (
            <PlaylistHeroAndList
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
      {showRightPanel && (
      <aside
        className="w-[280px] shrink-0 flex flex-col border-l"
        style={{ background: '#0e1117', borderColor: '#1e2530' }}
      >
        {/* Profile */}
        <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: '#1e2530' }}>
          <div className="flex items-center gap-2.5 relative">
            <button onClick={onAvatarClick} className="shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${avatarHue(userName || 'U')} 70% 50%), hsl(${avatarHue(userName || 'U') + 40} 70% 35%))`,
                  }}
                >
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate text-white">
                {isLoggedIn ? userName : 'Guest'}
              </p>
              <p className="text-[10px] text-[#4a5568] uppercase tracking-wider">Premium</p>
            </div>
            <button
              onClick={onOpenSettings}
              className="text-[#8896a4] hover:text-white transition-colors"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={() => setProfileMenu((v) => !v)}
              className="text-[#8896a4] hover:text-white transition-colors"
            >
              <ChevronDown size={14} />
            </button>
            {profileMenu && (
              <div
                className="absolute top-full right-0 mt-2 w-48 rounded-lg py-1.5 z-10"
                style={{
                  background: '#1a2035',
                  border: '1px solid #1e2530',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              >
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        setProfileMenu(false);
                        onViewChange('profile');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8896a4] hover:text-white hover:bg-white/5"
                    >
                      <Settings size={12} /> Profile
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenu(false);
                        onUploadClick();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8896a4] hover:text-white hover:bg-white/5"
                    >
                      <Upload size={12} /> Upload Song
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenu(false);
                        onToggleDeleteMode();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8896a4] hover:text-white hover:bg-white/5"
                    >
                      <Trash2 size={12} /> {isDeleteMode ? 'Exit Delete' : 'Delete Mode'}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileMenu(false);
                          onViewChange('admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8896a4] hover:text-white hover:bg-white/5"
                      >
                        <Shield size={12} /> Admin
                      </button>
                    )}
                    <div className="my-1 h-px bg-[#1e2530]" />
                    <button
                      onClick={() => {
                        setProfileMenu(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8896a4] hover:text-white hover:bg-white/5"
                    >
                      <LogOut size={12} /> Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setProfileMenu(false);
                      onGetStarted();
                    }}
                    className="w-full text-left px-3 py-2 text-[12px] text-white hover:bg-white/5"
                  >
                    Sign in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Friend Activity */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[10px] font-bold tracking-[0.18em] text-[#4a5568]">
            FRIEND ACTIVITY
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto ds-scroll px-2 pb-4">
          {friendActivity.map((f) => (
            <div
              key={f.name}
              className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
            >
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, hsl(${avatarHue(f.name)} 65% 50%), hsl(${avatarHue(f.name) + 50} 70% 30%))`,
                }}
              >
                {f.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{f.name}</p>
                <p className="text-[11px] text-[#8896a4] truncate">
                  {f.song} • {f.artist}
                </p>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider"
                  style={{
                    background: 'rgba(29,185,84,0.12)',
                    color: '#1DB954',
                  }}
                >
                  {f.playlist}
                </span>
              </div>
              <Heart
                size={12}
                className="text-[#4a5568] group-hover:text-[#1DB954] transition-colors mt-1"
              />
            </div>
          ))}
        </div>
      </aside>
      )}
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
  } = props;

  return (
    <div className="px-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6"
        style={{
          background: '#1a2035',
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
                  'radial-gradient(ellipse at 30% 50%, #1DB95430 0%, transparent 60%), linear-gradient(135deg, #1a2035, #0d1117)',
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #0d1117 0%, rgba(13,17,23,0.85) 40%, rgba(13,17,23,0.4) 100%)',
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
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#8896a4] mb-3">
              PLAYLIST
            </p>
            <h1
              className="ds-display text-5xl font-extrabold text-white mb-2 truncate"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
            >
              {playlist.name}
            </h1>
            <p className="text-[14px] text-[#8896a4] mb-3 truncate">
              {playlist.description || 'Forget the traffic stress.'}
            </p>
            <p className="text-[12px] text-[#8896a4] mb-5">
              Created by{' '}
              <span className="text-white font-medium">
                {playlist.owner_username || 'Alphatus'}
              </span>{' '}
              • {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              {songs.length > 0 && <> , {totalDuration(songs)}</>}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onPlayAll}
                disabled={songs.length === 0}
                className="ds-play-glow px-7 py-2.5 rounded-full text-[12px] font-bold tracking-[0.15em] text-black transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #1DB954 0%, #17a349 100%)',
                  boxShadow: '0 4px 20px #1DB95460',
                }}
              >
                PLAY
              </button>
              <button
                className="px-6 py-2.5 rounded-full text-[12px] font-bold tracking-[0.15em] text-white transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
              >
                FOLLOW
              </button>
              <button className="w-9 h-9 rounded-full flex items-center justify-center text-[#8896a4] hover:text-white hover:bg-white/5 transition-colors">
                <Download size={15} />
              </button>
              <button className="w-9 h-9 rounded-full flex items-center justify-center text-[#8896a4] hover:text-white hover:bg-white/5 transition-colors">
                <MoreHorizontal size={15} />
              </button>
              <span className="ml-2 text-[11px] text-[#8896a4]">
                <span className="text-white font-semibold">
                  {(47541).toLocaleString()}
                </span>{' '}
                followers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter + Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] text-[#8896a4] hover:text-white hover:bg-white/5 transition-colors">
          <Filter size={12} /> Filter
        </button>
        <div className="flex items-center gap-8 pr-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#4a5568] hidden md:block w-40">
            ARTIST
          </span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#4a5568] flex items-center gap-1">
            <Download size={10} /> DOWNLOAD
          </span>
        </div>
      </div>
      <div
        className="h-px mb-2"
        style={{ background: '#1e2530' }}
      />

      {/* Rows */}
      <div>
        {songs.length === 0 ? (
          <div className="py-16 text-center text-[#4a5568] text-[13px]">
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
                <button className="text-[#4a5568] hover:text-[#1DB954] transition-colors">
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => onPlaySong(song)}
                  className="text-[#8896a4] hover:text-white transition-colors"
                >
                  {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'ds-song-title text-[13px] font-medium truncate transition-colors',
                      isCurrent ? 'text-[#1DB954]' : 'text-white',
                    )}
                  >
                    {song.title}
                  </p>
                </div>
                <p className="text-[12px] text-[#8896a4] truncate hidden md:block">
                  {song.artist}
                </p>
                <p className="text-[11px] text-[#4a5568]">{fmtAgo(song.addedAt)}</p>
                <button className="text-[#4a5568] hover:text-white transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom progress + controls */}
      <div className="mt-10 px-2">
        <div className="relative h-0.5 rounded-full mb-5" style={{ background: '#1e2530' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1DB954, #17a349)',
              boxShadow: '0 0 8px #1DB95460',
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#1DB954] ds-dot-pulse"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
        </div>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={onShuffle}
            className={cn(
              'transition-colors',
              shuffle ? 'text-[#1DB954]' : 'text-[#8896a4] hover:text-white',
            )}
          >
            <Shuffle size={16} />
          </button>
          <button
            onClick={onPrev}
            className="text-[#8896a4] hover:text-white transition-colors"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="ds-play-glow w-12 h-12 rounded-full flex items-center justify-center text-black transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #1DB954 0%, #17a349 100%)',
              boxShadow: '0 4px 20px #1DB95460',
            }}
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button
            onClick={onNext}
            className="text-[#8896a4] hover:text-white transition-colors"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button
            onClick={onRepeat}
            className={cn(
              'transition-colors',
              repeat !== 'off' ? 'text-[#1DB954]' : 'text-[#8896a4] hover:text-white',
            )}
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
