import React from 'react';
import { MoreVertical, Trash2, Heart, Share2, PlusCircle, ListPlus } from 'lucide-react';
import { Song } from '@/types/music';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LibrarySongCardProps {
  song: Song;
  queue?: Song[];
  isDeleteMode?: boolean;
}

export function LibrarySongCard({ song, queue, isDeleteMode }: LibrarySongCardProps) {
  const { playSong, playerState, removeSong, playlists, addSongToPlaylist, addToUserQueue } = useMusicStore();
  const timeTheme = useTimeTheme();
  const isActive = playerState.currentSong?.id === song.id;
  const isPlaying = isActive && playerState.isPlaying;

  const handlePlay = () => playSong(song, queue);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSong(song.id);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addSongToPlaylist(playlistId, song.id);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer group",
        isActive && "bg-accent/50"
      )}
      onClick={handlePlay}
    >
      <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden flex-shrink-0 relative">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
        )}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-4">
              <span className={`w-1 h-full ${timeTheme.accentBg} rounded-full animate-pulse`} />
              <span className={`w-1 h-3 ${timeTheme.accentBg} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }} />
              <span className={`w-1 h-full ${timeTheme.accentBg} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isActive ? timeTheme.accentColor : "text-foreground")}>{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>

      {isDeleteMode && (
        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 animate-pulse p-1" title="Delete song">
          <Trash2 size={18} />
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
            <MoreVertical size={20} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAddToPlaylist('liked'); }}>
            <Heart size={16} className="mr-2" /> Add to Liked
          </DropdownMenuItem>
          {playlists.filter(p => p.id !== 'liked').map((playlist) => (
            <DropdownMenuItem key={playlist.id} onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(playlist.id); }}>
              <PlusCircle size={16} className="mr-2" /> Add to {playlist.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
            <Share2 size={16} className="mr-2" /> Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:text-red-400">
            <Trash2 size={16} className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
