import { useEffect, useRef } from 'react';

/**
 * Hook to maintain background audio playback when screen is off or app is in background.
 * Uses multiple strategies:
 * 1. Web Locks API - prevents browser from suspending the tab
 * 2. Visibility change handling - resumes playback when coming back
 * 3. Page show/hide events - handles mobile browser behavior
 * 4. Periodic keep-alive - prevents audio context suspension
 */
export function useBackgroundPlayback(
  audioRef: React.RefObject<HTMLAudioElement>,
  isPlaying: boolean,
  onResume?: () => void
) {
  const lockRef = useRef<any>(null);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const wasPlayingBeforeHideRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) return;

    // Strategy 1: Web Locks API to prevent tab suspension
    const acquireLock = async () => {
      if ('locks' in navigator && isPlaying) {
        try {
          // Request a lock that keeps the tab alive
          navigator.locks.request(
            'audio-playback-lock',
            { mode: 'exclusive', ifAvailable: true },
            async (lock) => {
              lockRef.current = lock;
              // Keep the lock held while playing
              return new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                  const store = (window as any).__musicStoreState;
                  if (!store?.playerState?.isPlaying) {
                    clearInterval(checkInterval);
                    resolve();
                  }
                }, 1000);
              });
            }
          );
        } catch {
          // Web Locks not supported or failed, continue with other strategies
          console.log('Web Locks not available');
        }
      }
    };

    if (isPlaying) {
      acquireLock();
    }

    // Strategy 2: Visibility change - resume when coming back to foreground
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.visibilityState === 'hidden') {
        // Store playing state before going to background
        wasPlayingBeforeHideRef.current = isPlaying;
        
        // Force audio to continue by touching the element
        if (isPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        // Coming back to foreground
        if (wasPlayingBeforeHideRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
          onResume?.();
        }
      }
    };

    // Strategy 3: Page show/hide for iOS Safari and mobile browsers
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!audioRef.current) return;
      
      // Persisted means page was restored from bfcache
      if (e.persisted && wasPlayingBeforeHideRef.current) {
        audioRef.current.play().catch(() => {});
        onResume?.();
      }
    };

    const handlePageHide = () => {
      wasPlayingBeforeHideRef.current = isPlaying;
    };

    // Strategy 4: Keep-alive ping to prevent audio context suspension
    if (isPlaying) {
      keepAliveIntervalRef.current = window.setInterval(() => {
        if (audioRef.current && isPlaying && !audioRef.current.paused) {
          // Touch the audio element to keep it alive by accessing properties
          const currentTime = audioRef.current.currentTime;
          if (currentTime > 0) {
            // Access volume to keep audio context active (read-only touch)
            void audioRef.current.volume;
          }
        }
      }, 10000); // Every 10 seconds
    }

    // Strategy 5: Handle focus events
    const handleFocus = () => {
      if (audioRef.current && wasPlayingBeforeHideRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
      
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, [audioRef, isPlaying, onResume]);

  // Strategy 6: Prevent audio element from pausing on screen lock (mobile)
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    const audio = audioRef.current;

    // Intercept pause events that might be triggered by system
    const handlePause = () => {
      // If we should be playing but audio paused, resume
      if (isPlaying && audio.paused) {
        // Small delay to avoid rapid pause/play cycles
        setTimeout(() => {
          if (isPlaying && audio.paused && audio.src) {
            audio.play().catch(() => {});
          }
        }, 100);
      }
    };

    // Handle audio stall (buffering issues in background)
    const handleStalled = () => {
      if (isPlaying && audio.src) {
        // Try to resume from current position
        const currentTime = audio.currentTime;
        audio.load();
        audio.currentTime = currentTime;
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('pause', handlePause);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [audioRef, isPlaying]);
}
