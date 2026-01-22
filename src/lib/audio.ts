/**
 * Apply defensive audio element settings to prevent background/lock-screen
 * transitions from altering playback speed/pitch on some mobile browsers.
 */
export function applySafePlaybackSettings(audio: HTMLAudioElement) {
  // Ensure playback speed does not drift
  audio.playbackRate = 1;
  audio.defaultPlaybackRate = 1;

  // Keep pitch stable when playbackRate changes (vendor-specific)
  // We set both because support varies across browsers.
  (audio as any).preservesPitch = true;
  (audio as any).webkitPreservesPitch = true;
  (audio as any).mozPreservesPitch = true;

  // Prefer eager buffering for smoother track transitions
  audio.preload = 'auto';
}
