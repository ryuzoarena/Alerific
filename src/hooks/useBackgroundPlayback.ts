import { useEffect, useRef } from 'react';
import { applyMobilePlaybackSettings, applySafePlaybackSettings, isMobilePlaybackDevice } from '@/lib/audio';

type WakeLockSentinelLike = {
  released?: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

const SILENT_HEARTBEAT_SRC =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

/**
 * Hook to maintain background audio playback when screen is off or app is in background.
 * 
 * IMPORTANT: Desktop keeps the minimal native path. Extra guards are enabled
 * only on mobile where browsers suspend media aggressively in the background.
 * 
 * Strategies:
 * 1. Visibility change handling - resumes playback when returning to foreground
 * 2. Page show/hide events - handles iOS Safari bfcache restoration
 * 3. Focus events - handles tab focus restoration
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
  const isPlayingRef = useRef(isPlaying);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const keepAliveRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    const mobilePlayback = isMobilePlaybackDevice();

    const getKeepAliveAudio = () => {
      if (!keepAliveRef.current) {
        const keepAlive = new Audio(SILENT_HEARTBEAT_SRC);
        keepAlive.loop = true;
        keepAlive.volume = 0.001;
        keepAlive.preload = 'auto';
        keepAlive.setAttribute('playsinline', 'true');
        keepAlive.setAttribute('webkit-playsinline', 'true');
        keepAliveRef.current = keepAlive;
      }
      return keepAliveRef.current;
    };

    const requestWakeLock = async () => {
      if (!mobilePlayback || !isPlayingRef.current || document.visibilityState !== 'visible') return;
      if (wakeLockRef.current && !wakeLockRef.current.released) return;

      try {
        const wakeLock = (navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
        }).wakeLock;
        if (!wakeLock) return;

        wakeLockRef.current = await wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
          if (isPlayingRef.current && document.visibilityState === 'visible') {
            requestWakeLock();
          }
        });
      } catch (err) {
        console.warn('Wake lock failed:', err);
      }
    };

    const releaseWakeLock = async () => {
      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (!wakeLock || wakeLock.released) return;
      await wakeLock.release().catch(() => {});
    };

    const startHeartbeat = () => {
      if (!mobilePlayback) return;
      getKeepAliveAudio().play().catch(() => {});
    };

    const stopHeartbeat = () => {
      const keepAlive = keepAliveRef.current;
      if (!keepAlive) return;
      keepAlive.pause();
      keepAlive.currentTime = 0;
    };

    const resumeIfNeeded = () => {
      const audio = audioRef.current;
      if (!audio || !wasPlayingBeforeHideRef.current) return;

      if (mobilePlayback) applyMobilePlaybackSettings(audio);
      else applySafePlaybackSettings(audio);

      if (audio.paused) {
        audio.play().then(onResume).catch((err) => {
          console.warn('Auto-resume failed:', err);
        });
      } else {
        onResume?.();
      }

      startHeartbeat();
      requestWakeLock();
    };

    // Strategy 1: Visibility change - resume only when RETURNING to foreground
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.visibilityState === 'hidden') {
        // Just remember the state, don't touch the audio element
        wasPlayingBeforeHideRef.current = isPlayingRef.current && !audioRef.current.paused;
      } else if (document.visibilityState === 'visible') {
        // Returning to foreground - only resume if we were playing before
        if (wasPlayingBeforeHideRef.current) setTimeout(resumeIfNeeded, 200);
      }
    };

    // Strategy 2: Page show for iOS Safari bfcache restoration
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!audioRef.current) return;
      
      if (e.persisted && wasPlayingBeforeHideRef.current && audioRef.current.paused) {
        setTimeout(resumeIfNeeded, 200);
      }
    };

    const handlePageHide = () => {
      wasPlayingBeforeHideRef.current = isPlayingRef.current && Boolean(audioRef.current && !audioRef.current.paused);
    };

    // Strategy 3: Focus event - resume when window regains focus
    const handleFocus = () => {
      if (wasPlayingBeforeHideRef.current) setTimeout(resumeIfNeeded, 200);
      else if (isPlayingRef.current) requestWakeLock();
    };

    const handlePlay = () => {
      if (!audioRef.current) return;
      if (mobilePlayback) applyMobilePlaybackSettings(audioRef.current);
      requestWakeLock();
      startHeartbeat();
    };

    const handlePause = () => {
      if (!isPlayingRef.current) {
        releaseWakeLock();
        stopHeartbeat();
      }
    };

    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    if (isPlayingRef.current) {
      handlePlay();
    }

    return () => {
      audioRef.current?.removeEventListener('play', handlePlay);
      audioRef.current?.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
      releaseWakeLock();
      stopHeartbeat();
    };
  }, [audioRef, onResume]);

  useEffect(() => {
    if (!isMobilePlaybackDevice()) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      applyMobilePlaybackSettings(audio);
      keepAliveRef.current?.play().catch(() => {});
    } else {
      keepAliveRef.current?.pause();
      if (keepAliveRef.current) keepAliveRef.current.currentTime = 0;
      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      wakeLock?.release().catch(() => {});
    }
  }, [audioRef, isPlaying]);

  // Second useEffect: apply safe settings once when playback starts
  // (keeps hook count stable across renders)
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;
    applySafePlaybackSettings(audioRef.current);
  }, [audioRef, isPlaying]);
}
