import { Home, Search, Library, Plus, Heart, Music2, Upload, Settings, MoreHorizontal, Radio, Moon, Flame, Clock, AudioLines } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  selectedPlaylistId?: string;
  onSelectPlaylist: (id: string) => void;
  onUploadClick: () => void;
  onAvatarClick?: () => void;
}

// Decorative gradients for placeholder thumbnails
const placeholderGradients = [
  'bg-gradient-to-br from-rose-500 to-orange-500',
  'bg-gradient-to-br from-violet-600 to-fuchsia-500',
  'bg-gradient-to-br from-sky-500 to-emerald-500',
  'bg-gradient-to-br from-amber-500 to-red-600',
  'bg-gradient-to-br from-cyan-500 to-blue-700',
  'bg-gradient-to-br from-pink-500 to-purple-700',
];

export function Sidebar({ activeView, onViewChange, selectedPlaylistId, onSelectPlaylist, onUploadClick, onAvatarClick }: SidebarProps) {
  const { playlists, songs, recentlyPlayedIds, createPlaylist } = useMusicStore();
  const { user } = useAuth();
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowNewPlaylist(false);
    }
  };

  const handleNavClick = (view: 'home' | 'search' | 'library' | 'playlist' | 'settings') => {
    onViewChange(view);
  };

  const handlePlaylistClick = (id: string) => {
    onSelectPlaylist(id);
    onViewChange('playlist');
  };

  const lastPlayedTitle = useMemo(() => {
    const id = recentlyPlayedIds?.[0];
    return id ? songs.find((s) => s.id === id)?.title : undefined;
  }, [recentlyPlayedIds, songs]);

  const filteredPlaylists = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, librarySearch]);

  const userInitial = (user?.email?.charAt(0) || 'U').toUpperCase();
  const userName = user?.email?.split('@')[0] || 'User';

  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className="h-full flex flex-col w-[240px] border-r border-white/5"
      style={{
        background: 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)',
        fontFamily: "'Poppins', 'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ===== Logo ===== */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(29,185,84,0.4)]">
            <Music2 size={18} className="text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-lg tracking-tight">Sybau</span>
            <span className="text-[10px] mt-0.5" style={{ color: '#666' }}>
              Your personal music space
            </span>
          </div>
        </div>
      </div>

      {/* ===== Main Navigation ===== */}
      <nav className="px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'relative flex items-center gap-3 h-11 px-4 rounded-md text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'text-primary bg-white/[0.06]'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.07]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
              )}
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3 h-px bg-white/[0.06]" />

      {/* ===== Upload Button ===== */}
      <div className="px-3">
        <button
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-black text-sm font-bold transition-all duration-150 hover:scale-[1.02]"
          style={{ boxShadow: '0 0 12px rgba(29,185,84,0.3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          <Upload size={16} strokeWidth={2.5} />
          <span>Upload Song</span>
        </button>
      </div>

      {/* ===== Library Section ===== */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-4 flex items-center justify-between mb-2">
          <button
            onClick={() => handleNavClick('library')}
            className={cn(
              'flex items-center gap-2 text-sm font-semibold transition-colors',
              activeView === 'library' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
            )}
          >
            <AudioLines size={18} />
            <span>Your Library</span>
          </button>

          <button
            onClick={() => setShowNewPlaylist((v) => !v)}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-all duration-150"
            title="Create playlist"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Library search */}
        <div className="px-3 mb-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
            <input
              type="text"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Search in library"
              className="w-full h-8 pl-8 pr-3 text-xs text-white placeholder:text-[#888] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '20px' }}
            />
          </div>
        </div>

        {/* Inline create playlist */}
        {showNewPlaylist && (
          <div className="px-3 pb-3">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              className="w-full px-3 py-2 bg-[#2a2a2a] rounded-md text-sm text-white placeholder:text-[#727272] focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreatePlaylist}
                className="flex-1 px-3 py-1.5 bg-primary text-black rounded-full text-xs font-bold hover:scale-105 transition-transform"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewPlaylist(false)}
                className="px-3 py-1.5 text-[#b3b3b3] text-xs hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Playlist list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
          {/* Real playlists */}
          {filteredPlaylists.map((playlist, idx) => {
            const playlistSongs = songs.filter((s) => playlist.songIds.includes(s.id));
            const coverUrl = playlistSongs[0]?.coverUrl;
            const isActive = selectedPlaylistId === playlist.id && activeView === 'playlist';
            const isLiked = playlist.id === 'liked';
            const subtitle = isLiked
              ? `Playlist • ${playlist.songIds.length} liked songs`
              : `Playlist • ${playlist.songIds.length} songs`;

            return (
              <button
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist.id)}
                className={cn(
                  'w-full flex items-center gap-3 h-12 px-2 rounded-md transition-all duration-150 text-left',
                  isActive ? 'bg-white/[0.10]' : 'hover:bg-white/[0.06]'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0',
                    !coverUrl && (isLiked ? 'bg-gradient-to-br from-indigo-600 to-purple-400' : placeholderGradients[idx % placeholderGradients.length])
                  )}
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : isLiked ? (
                    <Heart className="text-white" size={18} fill="white" />
                  ) : (
                    <Music2 className="text-white/90" size={16} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn('text-[13px] font-medium truncate', isActive ? 'text-primary' : 'text-white')}>
                    {playlist.name}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: '#888' }}>
                    {subtitle}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Decorative quick-access items (only when no search) */}
          {!librarySearch && (
            <>
              <SidebarStaticItem
                icon={<Clock size={16} className="text-white/90" />}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
                title="Recently Played"
                subtitle={lastPlayedTitle ? `Last played: ${lastPlayedTitle}` : 'No history yet'}
              />
              <SidebarStaticItem
                icon={<Radio size={16} className="text-white/90" />}
                gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600"
                title="My Mix 1"
                subtitle="Auto playlist • 12 songs"
              />
              <SidebarStaticItem
                icon={<Moon size={16} className="text-white/90" />}
                gradient="bg-gradient-to-br from-indigo-700 to-blue-900"
                title="Late Night Vibes"
                subtitle="Playlist • 8 songs"
              />
              <SidebarStaticItem
                icon={<Flame size={16} className="text-white/90" />}
                gradient="bg-gradient-to-br from-orange-500 to-red-600"
                title="Hype Mode"
                subtitle="Playlist • 5 songs"
              />

              {/* Create playlist dashed card */}
              <button
                onClick={() => setShowNewPlaylist(true)}
                className="w-full mt-2 flex items-center gap-3 h-12 px-2 rounded-md border border-dashed border-white/15 text-left transition-all duration-150 hover:border-white/30 hover:bg-white/[0.04] opacity-70 hover:opacity-100"
              >
                <div className="w-10 h-10 rounded-md bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                  <Plus size={18} className="text-white/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate text-white/80">Create your first playlist</p>
                  <p className="text-[11px] truncate" style={{ color: '#888' }}>
                    It's easy, we'll help you
                  </p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== User Profile Bar ===== */}
      <div
        className="flex items-center gap-3 px-3 py-3 border-t"
        style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onAvatarClick}
          className="w-8 h-8 rounded-full bg-[#535353] flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
        >
          <span className="text-white text-xs font-bold">{userInitial}</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
        </div>
        <button
          onClick={onAvatarClick}
          className="w-7 h-7 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </aside>
  );
}

function SidebarStaticItem({
  icon,
  gradient,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="w-full flex items-center gap-3 h-12 px-2 rounded-md transition-all duration-150 hover:bg-white/[0.06] cursor-pointer">
      <div className={cn('w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0', gradient)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium truncate text-white">{title}</p>
        <p className="text-[11px] truncate" style={{ color: '#888' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
