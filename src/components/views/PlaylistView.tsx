import { useMusicStore } from '@/stores/musicStore';
import { SongCard } from '@/components/SongCard';
import { Clock, Play, Heart, Music2, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';

interface PlaylistViewProps {
  playlistId: string;
  isDeleteMode?: boolean;
}

export function PlaylistView({ playlistId, isDeleteMode }: PlaylistViewProps) {
  const { playlists, songs, playSong, deletePlaylist, removeSongFromPlaylist } = useMusicStore();
  const timeTheme = useTimeTheme();
  
  const playlist = playlists.find(p => p.id === playlistId);
  const playlistSongs = songs.filter(s => playlist?.songIds.includes(s.id));

  if (!playlist) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Playlist not found</p>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  const coverUrl = playlistSongs[0]?.coverUrl;
  const isLikedSongs = playlist.id === 'liked';

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header with gradient */}
      <div className="relative">
        <div 
          className={cn(
            "h-64",
            isLikedSongs 
              ? "bg-gradient-to-b from-indigo-600/60 to-background" 
              : "bg-gradient-to-b from-primary/30 to-background"
          )}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
          <div 
            className={cn(
              "w-56 h-56 rounded shadow-2xl flex items-center justify-center overflow-hidden",
              !coverUrl && (isLikedSongs 
                ? "bg-gradient-to-br from-indigo-600 to-purple-400" 
                : "bg-secondary"
              )
            )}
          >
            {coverUrl ? (
              <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
            ) : isLikedSongs ? (
              <Heart size={80} className="text-white" fill="white" />
            ) : (
              <Music2 size={80} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Playlist</p>
            <h1 className="text-5xl font-bold mb-4">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-2">{playlist.description}</p>
            )}
            <p className="text-muted-foreground">
              {playlistSongs.length} songs
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          disabled={playlistSongs.length === 0}
          className={`w-14 h-14 theme-transition ${timeTheme.accentBg} rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100`}
        >
          <Play size={28} className={`theme-transition ${timeTheme.buttonText} ml-1`} fill="currentColor" />
        </button>
        
        {!isLikedSongs && (
          <button
            onClick={() => deletePlaylist(playlist.id)}
            className="p-3 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete playlist"
          >
            <Trash2 size={24} />
          </button>
        )}
      </div>

      {/* Track list header */}
      <div className="px-6 border-b border-border">
        <div className="flex items-center gap-4 py-2 text-sm text-muted-foreground">
          <div className="w-8 text-center">#</div>
          <div className="w-10" />
          <div className="flex-1">Title</div>
          <div className="hidden md:block flex-1">Album</div>
          <div className="w-12" />
          <div className="w-12 text-right">
            <Clock size={16} />
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Track list */}
      <div className="px-4 py-2">
        {playlistSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={64} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">No songs in this playlist</h2>
            <p className="text-muted-foreground">
              Add songs from your library to get started
            </p>
          </div>
        ) : (
          playlistSongs.map((song, index) => (
            <SongCard 
              key={song.id} 
              song={song} 
              index={index}
              showIndex
              queue={playlistSongs}
              isDeleteMode={isDeleteMode}
            />
          ))
        )}
      </div>
    </div>
  );
}
