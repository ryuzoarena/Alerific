import { Home, Search, Library, Plus, Heart, Music2, Upload, Settings } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  selectedPlaylistId?: string;
  onSelectPlaylist: (id: string) => void;
  onUploadClick: () => void;
}

export function Sidebar({ activeView, onViewChange, selectedPlaylistId, onSelectPlaylist, onUploadClick }: SidebarProps) {
  const { playlists, songs, createPlaylist } = useMusicStore();
  const timeTheme = useTimeTheme();
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
    <aside className="h-full bg-black flex flex-col gap-2 p-2 w-64">
      {/* Main Navigation */}
      <div className="bg-card rounded-lg p-4">
        <nav className="flex flex-col gap-4">
          <button
            onClick={() => handleNavClick('home')}
            className={cn(
              "flex items-center gap-4 text-sm font-semibold transition-colors",
              activeView === 'home' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home size={24} />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => handleNavClick('search')}
            className={cn(
              "flex items-center gap-4 text-sm font-semibold transition-colors",
              activeView === 'search' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search size={24} />
            <span>Search</span>
          </button>

          <button
            onClick={() => handleNavClick('settings')}
            className={cn(
              "flex items-center gap-4 text-sm font-semibold transition-colors",
              activeView === 'settings' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings size={24} />
            <span>Settings</span>
          </button>
        </nav>
        
        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className={`mt-4 w-full flex items-center gap-4 px-4 py-2.5 theme-transition ${timeTheme.accentBg} ${timeTheme.buttonText} rounded-full text-sm font-semibold hover:scale-[1.02] transition-transform`}
        >
          <Upload size={20} />
          <span>Upload Song</span>
        </button>
      </div>

      {/* Library */}
      <div className="bg-card rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('library')}
            className={cn(
              "flex items-center gap-3 text-sm font-semibold transition-colors",
              activeView === 'library' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Library size={24} />
            <span>Your Library</span>
          </button>
          
          <button
            onClick={() => setShowNewPlaylist(true)}
            className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Create playlist"
          >
            <Plus size={20} />
          </button>
        </div>

        {showNewPlaylist && (
          <div className="px-4 pb-4">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              className="w-full px-3 py-2 bg-secondary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreatePlaylist}
                className={`flex-1 px-3 py-1.5 theme-transition ${timeTheme.accentBg} ${timeTheme.buttonText} rounded-full text-xs font-semibold hover:scale-105 transition-transform`}
              >
                Create
              </button>
              <button
                onClick={() => setShowNewPlaylist(false)}
                className="px-3 py-1.5 text-muted-foreground text-xs hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {playlists.map((playlist) => {
            const playlistSongs = songs.filter(s => playlist.songIds.includes(s.id));
            const coverUrl = playlistSongs[0]?.coverUrl;
            const isActive = selectedPlaylistId === playlist.id && activeView === 'playlist';
            
            return (
              <button
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left",
                  isActive ? "bg-accent" : "hover:bg-accent"
                )}
              >
                <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {coverUrl ? (
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : playlist.id === 'liked' ? (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center">
                      <Heart className="text-white" size={20} fill="white" />
                    </div>
                  ) : (
                    <Music2 className="text-muted-foreground" size={20} />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm font-medium truncate theme-transition",
                    isActive ? timeTheme.accentColor : "text-foreground"
                  )}>
                    {playlist.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
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
