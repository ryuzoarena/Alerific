import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { UploadDialog } from '@/components/UploadDialog';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { LibraryView } from '@/components/views/LibraryView';
import { PlaylistView } from '@/components/views/PlaylistView';
import { Plus } from 'lucide-react';

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

      {/* Floating upload button */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40"
        title="Add music"
      >
        <Plus size={28} className="text-primary-foreground" />
      </button>

      {/* Upload dialog */}
      <UploadDialog 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
      />
    </div>
  );
};

export default Index;
