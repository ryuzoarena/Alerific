import { Home, Search, Library, Plus, Heart, Music2, Upload, Settings } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  selectedPlaylistId?: string;
  onSelectPlaylist: (id: string) => void;
  onUploadClick: () => void;
}

export function Sidebar({ activeView, onViewChange, selectedPlaylistId, onSelectPlaylist, onUploadClick }: SidebarProps) {
  const { playlists, songs, createPlaylist } = useMusicStore();
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

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

  return (
    <aside className="h-full bg-black flex flex-col gap-2 p-2 w-[280px]">
      {/* Logo */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Music2 size={18} className="text-black" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Sybau</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-[#121212] rounded-lg px-3 py-4">
        <nav className="flex flex-col gap-1">
          {[
            { id: 'home' as const, icon: Home, label: 'Home' },
            { id: 'search' as const, icon: Search, label: 'Search' },
            { id: 'settings' as const, icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-semibold transition-all duration-200",
                activeView === item.id
                  ? "text-white bg-white/10"
                  : "text-[#b3b3b3] hover:text-white"
              )}
            >
              <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className="mt-3 w-full flex items-center gap-3 px-3 py-2.5 rounded-full bg-primary text-black text-sm font-bold hover:bg-primary/90 hover:scale-[1.02] transition-all"
        >
          <Upload size={18} />
          <span>Upload Song</span>
        </button>
      </div>

      {/* Library */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('library')}
            className={cn(
              "flex items-center gap-3 text-sm font-semibold transition-colors",
              activeView === 'library' ? "text-white" : "text-[#b3b3b3] hover:text-white"
            )}
          >
            <Library size={24} />
            <span>Your Library</span>
          </button>

          <button
            onClick={() => setShowNewPlaylist(true)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
            title="Create playlist"
          >
            <Plus size={20} />
          </button>
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

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
          {playlists.map((playlist) => {
            const playlistSongs = songs.filter(s => playlist.songIds.includes(s.id));
            const coverUrl = playlistSongs[0]?.coverUrl;
            const isActive = selectedPlaylistId === playlist.id && activeView === 'playlist';

            return (
              <button
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-left group",
                  isActive ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {coverUrl ? (
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : playlist.id === 'liked' ? (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center">
                      <Heart className="text-white" size={20} fill="white" />
                    </div>
                  ) : (
                    <Music2 className="text-[#727272]" size={20} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-primary" : "text-white"
                  )}>
                    {playlist.name}
                  </p>
                  <p className="text-xs text-[#b3b3b3] truncate">
                    Playlist • {playlist.songIds.length} songs
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
