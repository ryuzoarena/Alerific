// Cross-device playback restore helper.
// When restoring playback (on initial load or via realtime),
// we set this ref BEFORE pushing the new song into the store.
// PlayerBar reads + clears it on the song-change effect so the
// audio element seeks to the saved position instead of resetting to 0.
export const pendingResumeRef: { time: number | null } = { time: null };
