import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { UploadDialog } from '@/components/UploadDialog';
import { MobileNavBar } from '@/components/MobileNavBar';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { LibraryView } from '@/components/views/LibraryView';
import { PlaylistView } from '@/components/views/PlaylistView';
import { SettingsView } from '@/components/views/SettingsView';
import { ArtistView } from '@/components/views/ArtistView';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { cn } from '@/lib/utils';

type View = 'home' | 'search' | 'library' | 'playlist' | 'settings' | 'artist';

const Index = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [showLyrics, setShowLyrics] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isFeaturedMenuOpen, setIsFeaturedMenuOpen] = useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string>('');

  const handleArtistClick = (artistName: string) => {
    setSelectedArtist(artistName);
    setActiveView('artist');
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeView isDeleteMode={isDeleteMode} onArtistClick={handleArtistClick} />;
      case 'search':
        return <SearchView isDeleteMode={isDeleteMode} />;
      case 'library':
        return <LibraryView isDeleteMode={isDeleteMode} />;
      case 'playlist':
        return <PlaylistView playlistId={selectedPlaylistId} isDeleteMode={isDeleteMode} />;
      case 'settings':
        return <SettingsView />;
      case 'artist':
        return <ArtistView artistName={selectedArtist} onBack={() => setActiveView('home')} isDeleteMode={isDeleteMode} />;
      default:
        return <HomeView isDeleteMode={isDeleteMode} onArtistClick={handleArtistClick} />;
    }
  };

  const timeTheme = useTimeTheme();

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden theme-transition",
      "lg:bg-black", // Desktop keeps black background
      `bg-gradient-to-b ${timeTheme.gradient}` // Mobile uses time-based gradient
    )}>
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block">
          <Sidebar 
            activeView={activeView}
            onViewChange={setActiveView}
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={setSelectedPlaylistId}
            onUploadClick={() => setShowUpload(true)}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 bg-transparent lg:bg-gradient-to-b lg:from-card lg:to-background lg:rounded-lg lg:m-2 lg:ml-0 overflow-y-auto pb-32 lg:pb-0 scrollbar-hide">
          {renderMainContent()}
        </main>

        {/* Lyrics panel - Desktop only */}
        <div className="hidden lg:block h-full min-h-0">
          <LyricsPanel 
            isOpen={showLyrics} 
            onClose={() => setShowLyrics(false)}
            loadedCoverUrl={currentCoverUrl}
          />
        </div>
      </div>

      {/* Player bar - hide on mobile when Featured menu is open */}
      <div className={cn(
        "transition-opacity duration-200",
        isFeaturedMenuOpen ? "lg:opacity-100 opacity-0 pointer-events-none lg:pointer-events-auto" : "opacity-100"
      )}>
        <PlayerBar 
          showLyrics={showLyrics}
          onToggleLyrics={() => setShowLyrics(!showLyrics)}
          onCoverUrlChange={setCurrentCoverUrl}
        />
      </div>

      {/* Mobile bottom navigation */}
      <MobileNavBar 
        activeView={activeView}
        onViewChange={setActiveView}
        onUploadClick={() => setShowUpload(true)}
        onDeleteModeToggle={() => setIsDeleteMode(!isDeleteMode)}
        isDeleteMode={isDeleteMode}
        onMenuOpenChange={setIsFeaturedMenuOpen}
      />

      {/* Upload dialog */}
      <UploadDialog 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
      />
    </div>
  );
};

export default Index;
