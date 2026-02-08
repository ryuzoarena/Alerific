import { useEffect } from "react";
import { applySafePlaybackSettings } from "@/lib/audio";

/**
 * Ensures safe playback settings stay applied across track transitions.
 * 
 * MINIMAL approach: only enforce on the two critical moments:
 * - loadedmetadata: when a new track source is loaded
 * - play: right before playback begins
 * 
 * We intentionally avoid listening to too many events (canplay, canplaythrough,
 * playing, ratechange, etc.) as over-enforcement can conflict with browser
 * audio management on mobile, causing crackling and distortion.
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

    // Apply once immediately for the current track
    enforce();

    // Only enforce on the two most critical lifecycle moments
    const events: Array<keyof HTMLMediaElementEventMap> = [
      "loadedmetadata",
      "play",
    ];

    events.forEach((evt) => audio.addEventListener(evt, enforce));
    return () => {
      events.forEach((evt) => audio.removeEventListener(evt, enforce));
    };
  }, [audioRef, enabled]);
}
