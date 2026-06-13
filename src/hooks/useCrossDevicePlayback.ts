import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMusicStore } from '@/stores/musicStore';
import { pendingResumeRef } from '@/lib/playbackRestore';

const DEVICE_ID_KEY = 'alphatus.deviceId';

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

interface RemoteRow {
  song_id: string | null;
  position_seconds: number;
  queue_song_ids: string[] | null;
  queue_index: number | null;
  is_playing: boolean;
  device_id: string | null;
  updated_at: string;
}

/**
 * Cross-device playback sync.
 * - Restores last song + position on login (paused; user taps play to resume).
 * - Saves state continuously while playing, and on tab hide / unload.
 * - When another device with the same account starts playing, this device pauses.
 */
export function useCrossDevicePlayback(userId: string | undefined | null) {
  const deviceIdRef = useRef<string>(getDeviceId());
  const restoredRef = useRef<string | null>(null);
  const lastSavedKeyRef = useRef<string>('');
  const songsLoaded = useMusicStore((s) => s.songsLoaded);

  // 1) Restore on login (waits until songs are loaded so we can hydrate the queue)
  useEffect(() => {
    if (!userId || !songsLoaded) return;
    if (restoredRef.current === userId) return;
    restoredRef.current = userId;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('playback_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled || error || !data) return;

      const row = data as unknown as RemoteRow;
      if (!row.song_id) return;

      const state = useMusicStore.getState();
      // Don't clobber an in-progress local session
      if (state.playerState.currentSong) return;

      const allSongs = state.songs;
      const song = allSongs.find((s) => s.id === row.song_id);
      if (!song) return;

      const queueIds = Array.isArray(row.queue_song_ids) ? row.queue_song_ids : [];
      const queue = queueIds
        .map((id) => allSongs.find((s) => s.id === id))
        .filter(Boolean) as typeof allSongs;
      const finalQueue = queue.length > 0 ? queue : [song];
      const idx = Math.max(0, finalQueue.findIndex((s) => s.id === song.id));

      // Tell PlayerBar where to seek once the audio loads
      pendingResumeRef.time = row.position_seconds || 0;

      useMusicStore.setState({
        playerState: {
          ...state.playerState,
          currentSong: song,
          isPlaying: false, // always paused on restore
          currentTime: row.position_seconds || 0,
        },
        queue: finalQueue,
        queueIndex: idx,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, songsLoaded]);

  // 2) Save state — throttled — on player changes
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const save = async (force = false) => {
      const s = useMusicStore.getState();
      const song = s.playerState.currentSong;
      if (!song) return;

      const key = `${song.id}|${Math.floor(s.playerState.currentTime)}|${s.playerState.isPlaying}`;
      if (!force && key === lastSavedKeyRef.current) return;
      lastSavedKeyRef.current = key;

      await supabase.from('playback_state').upsert(
        {
          user_id: userId,
          song_id: song.id,
          position_seconds: s.playerState.currentTime || 0,
          queue_song_ids: s.queue.map((q) => q.id),
          queue_index: s.queueIndex,
          is_playing: s.playerState.isPlaying,
          device_id: deviceIdRef.current,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    };

    // Subscribe to store changes; throttle to ~5s
    const unsubscribe = useMusicStore.subscribe(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        save();
      }, 5000);
    });

    // Save & pause when leaving / hiding
    const handleHide = () => {
      const s = useMusicStore.getState();
      if (s.playerState.isPlaying) {
        // pause locally; state will be saved as paused
        useMusicStore.setState({
          playerState: { ...s.playerState, isPlaying: false },
        });
      }
      save(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleHide();
    };

    window.addEventListener('pagehide', handleHide);
    window.addEventListener('beforeunload', handleHide);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      window.removeEventListener('pagehide', handleHide);
      window.removeEventListener('beforeunload', handleHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId]);

  // 3) Realtime: pause this device when another device starts playing
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`playback_state:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playback_state',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as unknown as RemoteRow | null;
          if (!row || !row.device_id) return;
          if (row.device_id === deviceIdRef.current) return;
          if (!row.is_playing) return;

          const s = useMusicStore.getState();
          if (s.playerState.isPlaying) {
            useMusicStore.setState({
              playerState: { ...s.playerState, isPlaying: false },
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
