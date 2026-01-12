import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { LibraryView } from '@/components/views/LibraryView';
import { PlaylistView } from '@/components/views/PlaylistView';

type View = 'home' | 'search' | 'library' | 'playlist';

const Index = () => {
  const [activeView, setActiveView] = useState<View>('home');
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
        {/* Sidebar */}
        <Sidebar 
          activeView={activeView}
          onViewChange={setActiveView}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={setSelectedPlaylistId}
        />

        {/* Main content */}
        <main className="flex-1 bg-gradient-to-b from-card to-background rounded-lg m-2 ml-0 overflow-hidden">
          {renderMainContent()}
        </main>

        {/* Lyrics panel */}
        <LyricsPanel 
          isOpen={showLyrics} 
          onClose={() => setShowLyrics(false)} 
        />
      </div>

      {/* Player bar */}
      <PlayerBar 
        showLyrics={showLyrics}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
      />
    </div>
  );
};

export default Index;
