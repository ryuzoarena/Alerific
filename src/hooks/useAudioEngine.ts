import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Web Audio API engine for mono audio and equalizer.
 * Connects to an existing HTMLAudioElement via MediaElementSource.
 */
export function useAudioEngine(audioRef: React.RefObject<HTMLAudioElement>) {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const mergerRef = useRef<ChannelMergerNode | null>(null);
  const monoGainRef = useRef<GainNode | null>(null);
  const stereoGainRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const connectedAudioRef = useRef<HTMLAudioElement | null>(null);

  const { monoAudio, eqEnabled, eqBands } = useSettingsStore();

  // Initialize the audio graph
  const initGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || connectedAudioRef.current === audio) return;

    // If we already have a context for a different audio element, clean up
    if (ctxRef.current && connectedAudioRef.current !== audio) {
      try { ctxRef.current.close(); } catch {}
      ctxRef.current = null;
      sourceRef.current = null;
      connectedAudioRef.current = null;
    }

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;
      connectedAudioRef.current = audio;

      // Create EQ filters (5 bands)
      const filters: BiquadFilterNode[] = eqBands.map((band, i) => {
        const filter = ctx.createBiquadFilter();
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === eqBands.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = band.frequency;
        filter.gain.value = eqEnabled ? band.gain : 0;
        return filter;
      });
      filtersRef.current = filters;

      // Mono/Stereo path
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      const monoGain = ctx.createGain();
      const stereoGain = ctx.createGain();

      splitterRef.current = splitter;
      mergerRef.current = merger;
      monoGainRef.current = monoGain;
      stereoGainRef.current = stereoGain;

      // Chain: source → filters → splitter → mono/stereo → destination
      // Connect EQ chain
      let lastNode: AudioNode = source;
      filters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      // Connect to splitter
      lastNode.connect(splitter);

      // Stereo path: splitter → stereoGain → destination
      splitter.connect(stereoGain, 0);
      splitter.connect(stereoGain, 1);
      // Actually for stereo, we need to preserve channels
      // Let's use a simpler approach

      // Disconnect and redo with simpler routing
      lastNode.disconnect();
      
      // Simple approach: source → EQ filters → monoGain/stereoGain → destination
      // For mono: use a ChannelMergerNode approach
      
      // Re-connect EQ chain to mono/stereo routing
      if (monoAudio) {
        // Mono: merge both channels into one
        lastNode.connect(splitter);
        // Mix L+R into mono
        const monoMerger = ctx.createChannelMerger(1);
        splitter.connect(monoMerger, 0, 0);
        splitter.connect(monoMerger, 1, 0);
        
        // Then split mono back to both speakers
        const finalMerger = ctx.createChannelMerger(2);
        monoMerger.connect(finalMerger, 0, 0);
        monoMerger.connect(finalMerger, 0, 1);
        finalMerger.connect(ctx.destination);
      } else {
        // Stereo: direct connection
        lastNode.connect(ctx.destination);
      }
    } catch (e) {
      console.warn('Web Audio API initialization failed:', e);
    }
  }, [audioRef, monoAudio, eqEnabled, eqBands]);

  // Re-initialize graph when mono or audio element changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Wait for audio to be ready
    const handleCanPlay = () => {
      if (!ctxRef.current) {
        initGraph();
      }
    };

    // Initialize if audio already has a source
    if (audio.src || audio.currentSrc) {
      initGraph();
    }

    audio.addEventListener('loadedmetadata', handleCanPlay);
    return () => {
      audio.removeEventListener('loadedmetadata', handleCanPlay);
    };
  }, [initGraph]);

  // Update mono routing without full rebuild
  useEffect(() => {
    if (!ctxRef.current || !sourceRef.current) return;
    
    const ctx = ctxRef.current;
    const filters = filtersRef.current;
    if (filters.length === 0) return;

    const lastFilter = filters[filters.length - 1];

    try {
      // Disconnect current output
      lastFilter.disconnect();

      if (monoAudio) {
        const splitter = ctx.createChannelSplitter(2);
        const monoMerger = ctx.createChannelMerger(1);
        const finalMerger = ctx.createChannelMerger(2);

        lastFilter.connect(splitter);
        splitter.connect(monoMerger, 0, 0);
        splitter.connect(monoMerger, 1, 0);
        monoMerger.connect(finalMerger, 0, 0);
        monoMerger.connect(finalMerger, 0, 1);
        finalMerger.connect(ctx.destination);
      } else {
        lastFilter.connect(ctx.destination);
      }
    } catch (e) {
      console.warn('Failed to update mono routing:', e);
    }
  }, [monoAudio]);

  // Update EQ filter gains
  useEffect(() => {
    const filters = filtersRef.current;
    if (filters.length === 0) return;

    filters.forEach((filter, i) => {
      if (eqBands[i]) {
        filter.gain.value = eqEnabled ? eqBands[i].gain : 0;
      }
    });
  }, [eqBands, eqEnabled]);

  // Resume AudioContext on user interaction (browser policy)
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const resume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };

    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });

    return () => {
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        ctxRef.current?.close();
      } catch {}
    };
  }, []);
}
