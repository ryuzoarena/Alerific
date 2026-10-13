import { useState } from 'react';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { UploadDialog } from '@/components/UploadDialog';
import { MobileNavBar } from '@/components/MobileNavBar';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { AuthPage } from '@/components/AuthPage';
import { QueuePanel } from '@/components/QueuePanel';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { CreatePlaylistDialog } from '@/components/CreatePlaylistDialog';
import { cn } from '@/lib/utils';
import { useMusicStore } from '@/stores/musicStore';
import { DesktopShell } from '@/components/desktop/DesktopShell';
import { AppBackground } from '@/components/AppBackground';

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
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  const auth = useAuth();
  const { isLoggedIn, displayName, signIn, signUp, signOut, profile, user } = auth;
  const { isAdmin } = useUserRole();

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

  return (
    <>
    <AppBackground />
    <div className={cn(
      "h-dvh flex flex-col overflow-hidden relative z-10",
      "bg-background"
    )}>
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop premium 3-column shell (≥1100px) */}
        <DesktopShell
          activeView={activeView}
          onViewChange={setActiveView}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={setSelectedPlaylistId}
          selectedArtist={selectedArtist}
          onArtistClick={handleArtistClick}
          onAvatarClick={() => setIsDrawerOpen(true)}
          isLoggedIn={isLoggedIn}
          userName={displayName}
          avatarUrl={profile?.avatar_url}
          onGetStarted={() => setShowAuth(true)}
          onUploadClick={() => setShowUpload(true)}
          onCreatePlaylistClick={() => isLoggedIn ? setShowCreatePlaylist(true) : setShowAuth(true)}
          onOpenSettings={() => setIsSettingsDrawerOpen(true)}
          onSignOut={signOut}
          isAdmin={isAdmin}
          isDeleteMode={isDeleteMode}
          onToggleDeleteMode={() => setIsDeleteMode(!isDeleteMode)}
        />

        <div className="hidden min-[1100px]:block h-full min-h-0">
          <LyricsPanel isOpen={showLyrics} onClose={() => setShowLyrics(false)} loadedCoverUrl={currentCoverUrl} />
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
    </>
  );
};

export default Index;
