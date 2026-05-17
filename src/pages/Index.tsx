import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { UploadDialog } from '@/components/UploadDialog';
import { MobileNavBar } from '@/components/MobileNavBar';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { AuthPage } from '@/components/AuthPage';
import { QueuePanel } from '@/components/QueuePanel';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { LibraryView } from '@/components/views/LibraryView';
import { PlaylistView } from '@/components/views/PlaylistView';
import { SettingsView } from '@/components/views/SettingsView';
import { ArtistView } from '@/components/views/ArtistView';
import { AdminView } from '@/components/views/AdminView';
import { ProfileView } from '@/components/views/ProfileView';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { CreatePlaylistDialog } from '@/components/CreatePlaylistDialog';
import { cn } from '@/lib/utils';
import { useMusicStore } from '@/stores/musicStore';

type View = 'home' | 'search' | 'library' | 'playlist' | 'settings' | 'artist' | 'admin' | 'profile';

const Index = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [showLyrics, setShowLyrics] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  const auth = useAuth();
  const { isLoggedIn, displayName, signIn, signUp, signOut, profile, user } = auth;
  const { isAdmin } = useUserRole();
  const timeTheme = useTimeTheme();

  const handleArtistClick = (artistName: string) => {
    setSelectedArtist(artistName);
    setActiveView('artist');
  };

  // Show auth page
  if (showAuth && !isLoggedIn) {
    return (
      <AuthPage
        onBack={() => setShowAuth(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    );
  }

  const renderMainContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView 
            isDeleteMode={isDeleteMode} 
            onArtistClick={handleArtistClick}
            onAvatarClick={() => setIsDrawerOpen(true)}
            isLoggedIn={isLoggedIn}
            userName={displayName}
            onGetStarted={() => setShowAuth(true)}
            onSelectPlaylist={(id) => { setSelectedPlaylistId(id); setActiveView('playlist'); }}
          />
        );
      case 'search':
        return (
          <SearchView
            isDeleteMode={isDeleteMode}
            onSelectPlaylist={async (id) => {
              await useMusicStore.getState().previewPublicPlaylist(id);
              setSelectedPlaylistId(id);
              setActiveView('playlist');
            }}
          />
        );
      case 'library':
        return <LibraryView isDeleteMode={isDeleteMode} />;
      case 'playlist':
        return <PlaylistView playlistId={selectedPlaylistId} isDeleteMode={isDeleteMode} />;
      case 'settings':
        return <SettingsView />;
      case 'artist':
        return <ArtistView artistName={selectedArtist} onBack={() => setActiveView('home')} isDeleteMode={isDeleteMode} />;
      case 'profile':
        return (
          <ProfileView
            onBack={() => setActiveView('home')}
            userName={displayName}
            avatarUrl={profile?.avatar_url}
            onProfileUpdate={() => {
              // Re-fetch profile by triggering auth refresh
              if (user) {
                auth.loading; // trigger re-render
              }
            }}
          />
        );
      case 'admin':
        return isAdmin ? <AdminView /> : <HomeView isDeleteMode={isDeleteMode} onArtistClick={handleArtistClick} onAvatarClick={() => setIsDrawerOpen(true)} isLoggedIn={isLoggedIn} userName={displayName} onGetStarted={() => setShowAuth(true)} />;
      default:
        return (
          <HomeView 
            isDeleteMode={isDeleteMode} 
            onArtistClick={handleArtistClick}
            onAvatarClick={() => setIsDrawerOpen(true)}
            isLoggedIn={isLoggedIn}
            userName={displayName}
            onGetStarted={() => setShowAuth(true)}
            onSelectPlaylist={(id) => { setSelectedPlaylistId(id); setActiveView('playlist'); }}
          />
        );
    }
  };

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden",
      "bg-black"
    )}>
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="hidden lg:block">
          <Sidebar 
            activeView={activeView}
            onViewChange={setActiveView}
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={setSelectedPlaylistId}
            onUploadClick={() => setShowUpload(true)}
            onAvatarClick={() => setIsDrawerOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onOpenSettings={() => setIsSettingsDrawerOpen(true)}
          />
        </div>

        <main className="flex-1 overflow-y-auto pb-32 lg:pb-0 scrollbar-hide relative lg:bg-[#121212] lg:rounded-lg lg:m-2 lg:ml-0">
          {/* Mobile gradient background */}
          <div className={cn("absolute inset-0 pointer-events-none lg:hidden", `bg-gradient-to-b ${timeTheme.gradient}`)} style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 85%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 85%)' }} />
          <div className="relative z-10">
            {renderMainContent()}
          </div>
        </main>

        <div className="hidden lg:block h-full min-h-0">
          <LyricsPanel 
            isOpen={showLyrics} 
            onClose={() => setShowLyrics(false)}
            loadedCoverUrl={currentCoverUrl}
          />
        </div>
      </div>

      <PlayerBar 
        showLyrics={showLyrics}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
        onCoverUrlChange={setCurrentCoverUrl}
      />

      <MobileNavBar 
        activeView={activeView}
        onViewChange={setActiveView}
        onCreatePlaylistClick={() => isLoggedIn ? setShowCreatePlaylist(true) : setShowAuth(true)}
      />

      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isLoggedIn={isLoggedIn}
        userName={displayName}
        onUploadClick={() => setShowUpload(true)}
        onDeleteModeToggle={() => setIsDeleteMode(!isDeleteMode)}
        isDeleteMode={isDeleteMode}
        onViewChange={setActiveView}
        onGetStarted={() => { setIsDrawerOpen(false); setShowAuth(true); }}
        onSignOut={signOut}
        isAdmin={isAdmin}
      />

      <UploadDialog 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
      />

      <SettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
      />

      <QueuePanel />

      <CreatePlaylistDialog
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreated={(id) => {
          setSelectedPlaylistId(id);
          setActiveView('playlist');
        }}
      />
    </div>
  );
};

export default Index;
