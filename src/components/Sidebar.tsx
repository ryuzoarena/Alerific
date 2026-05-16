import { Home, Search, Plus, Heart, Music2, Upload, Settings, MoreHorizontal, Radio, Moon, Flame, Clock, AudioLines, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { CreatePlaylistDialog } from '@/components/CreatePlaylistDialog';
import { PlaylistCoverArt } from '@/components/PlaylistCoverArt';


interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  selectedPlaylistId?: string;
  onSelectPlaylist: (id: string) => void;
  onUploadClick: () => void;
  onAvatarClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
}

const placeholderGradients = [
  'bg-gradient-to-br from-rose-500 to-orange-500',
  'bg-gradient-to-br from-violet-600 to-fuchsia-500',
  'bg-gradient-to-br from-sky-500 to-emerald-500',
  'bg-gradient-to-br from-amber-500 to-red-600',
  'bg-gradient-to-br from-cyan-500 to-blue-700',
  'bg-gradient-to-br from-pink-500 to-purple-700',
];

export function Sidebar({
  activeView,
  onViewChange,
  selectedPlaylistId,
  onSelectPlaylist,
  onUploadClick,
  onAvatarClick,
  collapsed = false,
  onToggleCollapse,
  onOpenSettings,
}: SidebarProps) {
  const { playlists, songs, recentlyPlayedIds } = useMusicStore();
  const { user } = useAuth();
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  const handleCreated = (id: string) => {
    onSelectPlaylist(id);
    onViewChange('playlist');
  };

  const handleNavClick = (view: 'home' | 'search' | 'library' | 'playlist') => {
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

  // Settings is no longer a permanent nav item — accessed via gear at bottom
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'search' as const, icon: Search, label: 'Search' },
  ];

  return (
    <aside
      className={cn(
        'h-full flex flex-col border-r border-white/5 transition-[width] duration-300 ease-out',
        collapsed ? 'w-[64px]' : 'w-[240px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)',
        fontFamily: "'Poppins', 'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ===== Logo + collapse toggle ===== */}
      <div className={cn('pt-5 pb-4', collapsed ? 'px-2' : 'px-4')}>
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(29,185,84,0.4)] flex-shrink-0">
              <Music2 size={18} className="text-black" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-white font-bold text-lg tracking-tight">Sybau</span>
                <span className="text-[10px] mt-0.5 truncate" style={{ color: '#666' }}>
                  Your personal music space
                </span>
              </div>
            )}
          </div>
          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="w-7 h-7 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
        {collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="mt-3 w-full h-7 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* ===== Main Navigation ===== */}
      <nav className={cn('flex flex-col gap-0.5', collapsed ? 'px-2' : 'px-2')}>
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center h-11 rounded-md text-sm font-semibold transition-all duration-150',
                collapsed ? 'justify-center px-0' : 'gap-3 px-4',
                isActive
                  ? 'text-primary bg-white/[0.06]'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.07]'
              )}
            >
              {isActive && !collapsed && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
              )}
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mx-4 my-3 h-px bg-white/[0.06]" />

      {/* ===== Upload Button ===== */}
      <div className={collapsed ? 'px-2' : 'px-3'}>
        <button
          onClick={onUploadClick}
          title={collapsed ? 'Upload Song' : undefined}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-black text-sm font-bold transition-all duration-150 hover:scale-[1.02]'
          )}
          style={{ boxShadow: '0 0 12px rgba(29,185,84,0.3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          <Upload size={16} strokeWidth={2.5} />
          {!collapsed && <span>Upload Song</span>}
        </button>
      </div>

      {/* ===== Library Section ===== */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        {!collapsed && (
          <>
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
          </>
        )}

        {/* Collapsed: just show library icon button */}
        {collapsed && (
          <div className="px-2">
            <button
              onClick={() => handleNavClick('library')}
              title="Your Library"
              className={cn(
                'w-full h-11 rounded-md flex items-center justify-center transition-colors',
                activeView === 'library'
                  ? 'text-white bg-white/[0.06]'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.07]'
              )}
            >
              <AudioLines size={20} />
            </button>
          </div>
        )}

        {/* Playlist list — only when expanded */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
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
        )}
      </div>

      {/* ===== Settings gear button (above profile) ===== */}
      <div
        className={cn(
          'flex items-center border-t',
          collapsed ? 'justify-center px-2 py-2' : 'justify-end px-3 py-2'
        )}
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-white/[0.08] opacity-50 hover:opacity-100 transition-all duration-300 hover:rotate-[30deg]"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* ===== User Profile Bar ===== */}
      <div
        className={cn(
          'flex items-center border-t',
          collapsed ? 'justify-center gap-0 px-2 py-3' : 'gap-3 px-3 py-3'
        )}
        style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onAvatarClick}
          className="w-8 h-8 rounded-full bg-[#535353] flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
        >
          <span className="text-white text-xs font-bold">{userInitial}</span>
        </button>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
            </div>
            <button
              onClick={onAvatarClick}
              className="w-7 h-7 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
          </>
        )}
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
