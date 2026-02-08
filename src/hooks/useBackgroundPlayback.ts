import { useEffect, useRef } from 'react';
import { applySafePlaybackSettings } from '@/lib/audio';

/**
 * Hook to maintain background audio playback when screen is off or app is in background.
 * 
 * IMPORTANT: This hook uses a MINIMAL approach to avoid fighting the browser's
 * audio management, which causes crackling/distortion on mobile devices.
 * 
 * Strategies:
 * 1. Visibility change handling - resumes playback when returning to foreground
 * 2. Page show/hide events - handles iOS Safari bfcache restoration
 * 3. Focus events - handles tab focus restoration
 * 
 * We intentionally DO NOT:
 * - Intercept pause events (causes rapid play/pause = crackling)
 * - Call audio.load() on stall (resets buffer = distortion)  
 * - Use keep-alive pings (interferes with browser audio management)
 * - Use Web Locks API (unnecessary overhead, doesn't prevent audio issues)
 * 
 * Background playback is primarily handled by the Media Session API
 * configured in PlayerBar.tsx, which is the correct browser-native approach.
 */
export function useBackgroundPlayback(
  audioRef: React.RefObject<HTMLAudioElement>,
  isPlaying: boolean,
  onResume?: () => void
) {
  const wasPlayingBeforeHideRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) return;

    // Strategy 1: Visibility change - resume only when RETURNING to foreground
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.visibilityState === 'hidden') {
        // Just remember the state, don't touch the audio element
        wasPlayingBeforeHideRef.current = isPlaying;
      } else if (document.visibilityState === 'visible') {
        // Returning to foreground - only resume if we were playing before
        if (wasPlayingBeforeHideRef.current && audioRef.current.paused) {
          // Small delay to let the browser stabilize after coming to foreground
          setTimeout(() => {
            if (audioRef.current && wasPlayingBeforeHideRef.current && audioRef.current.paused) {
              applySafePlaybackSettings(audioRef.current);
              audioRef.current.play().catch(() => {});
              onResume?.();
            }
          }, 200);
        }
      }
    };

    // Strategy 2: Page show for iOS Safari bfcache restoration
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!audioRef.current) return;
      
      if (e.persisted && wasPlayingBeforeHideRef.current && audioRef.current.paused) {
        setTimeout(() => {
          if (audioRef.current && audioRef.current.paused) {
            applySafePlaybackSettings(audioRef.current);
            audioRef.current.play().catch(() => {});
            onResume?.();
          }
        }, 200);
      }
    };

    const handlePageHide = () => {
      wasPlayingBeforeHideRef.current = isPlaying;
    };

    // Strategy 3: Focus event - resume when window regains focus
    const handleFocus = () => {
      if (audioRef.current && wasPlayingBeforeHideRef.current && audioRef.current.paused) {
        setTimeout(() => {
          if (audioRef.current && wasPlayingBeforeHideRef.current && audioRef.current.paused) {
            applySafePlaybackSettings(audioRef.current);
            audioRef.current.play().catch(() => {});
          }
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
    };
  }, [audioRef, isPlaying, onResume]);
}
