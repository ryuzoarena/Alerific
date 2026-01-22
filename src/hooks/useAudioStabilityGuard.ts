import { useEffect } from "react";
import { applySafePlaybackSettings } from "@/lib/audio";

/**
 * Ensures safe playback settings stay applied across track transitions.
 * Some mobile browsers can reset playbackRate/pitch after a new src is loaded
 * or when playback resumes in the background.
 */
export function useAudioStabilityGuard(
  audioRef: React.RefObject<HTMLAudioElement>,
  enabled: boolean
) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;

    const enforce = () => {
      applySafePlaybackSettings(audio);
    };

    // Apply once immediately, then keep re-applying on key lifecycle events.
    enforce();

    const events: Array<keyof HTMLMediaElementEventMap> = [
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "canplaythrough",
      "play",
      "playing",
      "ratechange",
    ];

    events.forEach((evt) => audio.addEventListener(evt, enforce));
    return () => {
      events.forEach((evt) => audio.removeEventListener(evt, enforce));
    };
  }, [audioRef, enabled]);
}
