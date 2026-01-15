import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { UploadDialog } from '@/components/UploadDialog';
import { MobileNavBar } from '@/components/MobileNavBar';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { LibraryView } from '@/components/views/LibraryView';
import { PlaylistView } from '@/components/views/PlaylistView';
import { useMusicStore } from '@/stores/musicStore';

type View = 'home' | 'search' | 'library' | 'playlist';

const Index = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [showLyrics, setShowLyrics] = useState(false);

  const renderMainContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'library':
        return <LibraryView />;
      case 'playlist':
        return <PlaylistView playlistId={selectedPlaylistId} />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
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
        <main className="flex-1 bg-gradient-to-b from-card to-background lg:rounded-lg lg:m-2 lg:ml-0 overflow-y-auto pb-32 lg:pb-0 scrollbar-hide">
          {renderMainContent()}
        </main>

        {/* Lyrics panel - Desktop only */}
        <div className="hidden lg:block">
          <LyricsPanel 
            isOpen={showLyrics} 
            onClose={() => setShowLyrics(false)} 
          />
        </div>
      </div>

      {/* Player bar */}
      <PlayerBar 
        showLyrics={showLyrics}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
      />

      {/* Mobile bottom navigation */}
      <MobileNavBar 
        activeView={activeView}
        onViewChange={setActiveView}
        onUploadClick={() => setShowUpload(true)}
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
