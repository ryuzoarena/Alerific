import { useEffect, useState } from 'react';
import { Play, Clock, MoreHorizontal, Heart, Plus, Trash2 } from 'lucide-react';
import { Song } from '@/types/music';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';

interface SongCardProps {
  song: Song;
  index?: number;
  showIndex?: boolean;
  queue?: Song[];
}

export function SongCard({ song, index, showIndex, queue }: SongCardProps) {
  const { playSong, playerState, loadSongMedia, removeSong } = useMusicStore();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const isActive = playerState.currentSong?.id === song.id;

  // Load cover from IndexedDB
  useEffect(() => {
    loadSongMedia(song.id).then((media) => {
      if (media?.coverUrl) {
        setCoverUrl(media.coverUrl);
      }
    });
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, [song.id]);

  const handlePlay = () => {
    playSong(song, queue);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSong(song.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer",
        isActive && "bg-accent"
      )}
      onClick={handlePlay}
    >
      {/* Index / Play button */}
      <div className="w-8 flex items-center justify-center">
        {showIndex ? (
          <>
            <span className={cn(
              "text-sm group-hover:hidden",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {isPlaying ? (
                <span className="flex gap-0.5">
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </span>
              ) : (
                index! + 1
              )}
            </span>
            <Play 
              size={16} 
              className="hidden group-hover:block text-foreground" 
              fill="currentColor"
            />
          </>
        ) : (
          <Play 
            size={16} 
            className="opacity-0 group-hover:opacity-100 text-foreground transition-opacity" 
            fill="currentColor"
          />
        )}
      </div>

      {/* Cover */}
      <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isActive ? "text-primary" : "text-foreground"
        )}>
          {song.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {song.artist}
        </p>
      </div>

      {/* Album */}
      <div className="hidden md:block flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">
          {song.album || 'Unknown Album'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-muted-foreground hover:text-foreground">
          <Heart size={16} />
        </button>
        <button 
          onClick={handleDelete}
          className="text-muted-foreground hover:text-red-400"
          title="Delete song"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Duration */}
      <div className="w-12 text-right">
        <span className="text-sm text-muted-foreground">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
}

// Grid card variant for home view
export function SongGridCard({ song, queue }: SongCardProps) {
  const { playSong, playerState, togglePlay, loadSongMedia, removeSong } = useMusicStore();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const isPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;
  const isActive = playerState.currentSong?.id === song.id;

  // Load cover from IndexedDB
  useEffect(() => {
    loadSongMedia(song.id).then((media) => {
      if (media?.coverUrl) {
        setCoverUrl(media.coverUrl);
      }
    });
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, [song.id]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      togglePlay();
    } else {
      playSong(song, queue);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSong(song.id);
  };

  return (
    <div className="song-card bg-card p-4 rounded-lg cursor-pointer group relative">
      <div className="relative mb-4">
        <div className="aspect-square rounded-md overflow-hidden bg-secondary shadow-lg">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
          )}
        </div>
        
        {/* Delete button overlay */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          title="Delete song"
        >
          <Trash2 size={14} className="text-white" />
        </button>
        
        {/* Play button overlay */}
        <button
          onClick={handlePlay}
          className="play-overlay absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-primary/90 transition-all"
        >
          {isPlaying ? (
            <span className="flex gap-0.5">
              <span className="w-1 h-4 bg-primary-foreground rounded-full" />
              <span className="w-1 h-4 bg-primary-foreground rounded-full" />
            </span>
          ) : (
            <Play size={24} className="text-primary-foreground ml-1" fill="currentColor" />
          )}
        </button>
      </div>

      <h3 className={cn(
        "font-semibold text-sm truncate mb-1",
        isActive ? "text-primary" : "text-foreground"
      )}>
        {song.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate">
        {song.artist}
      </p>
    </div>
  );
}
