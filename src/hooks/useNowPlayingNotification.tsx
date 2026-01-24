import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Song } from "@/types/music";

/**
 * Shows a "Now Playing" toast notification when a new song starts playing.
 * Includes album art, title, and artist info.
 */
export function useNowPlayingNotification(
  currentSong: Song | null,
  coverUrl: string | null,
  isPlaying: boolean
) {
  const lastNotifiedSongId = useRef<string | null>(null);

  useEffect(() => {
    // Only show notification when:
    // 1. There's a current song
    // 2. Music is playing
    // 3. This is a different song than the last one we notified about
    if (!currentSong || !isPlaying) return;
    if (currentSong.id === lastNotifiedSongId.current) return;

    // Update the last notified song
    lastNotifiedSongId.current = currentSong.id;

    // Small delay to ensure coverUrl is available
    const timeoutId = setTimeout(() => {
      toast.custom(
        (t) => (
          <div 
            className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-lg min-w-[280px]"
            onClick={() => toast.dismiss(t)}
          >
            {/* Album Art */}
            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-secondary">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <span className="text-lg">🎵</span>
                </div>
              )}
            </div>
            
            {/* Song Info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Now Playing</p>
              <p className="text-sm font-medium truncate text-foreground">{currentSong.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>
        ),
        {
          duration: 3000,
          position: "top-center",
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentSong?.id, isPlaying, coverUrl, currentSong?.title, currentSong?.artist]);
}
