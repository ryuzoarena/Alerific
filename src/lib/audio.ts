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

  // iOS Safari: keep inline audio eligible for lock-screen/background handling.
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
}

export function isMobilePlaybackDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const touchDevice = navigator.maxTouchPoints > 0;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua);

  return mobileUA || (touchDevice && coarsePointer);
}

export function applyMobilePlaybackSettings(audio: HTMLAudioElement) {
  applySafePlaybackSettings(audio);

  // Some mobile browsers suspend media whose effective volume is exactly 0.
  if (audio.volume === 0) {
    audio.volume = 0.01;
  }
}
