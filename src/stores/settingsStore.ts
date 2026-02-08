import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EQPreset = 'flat' | 'bass-boost' | 'treble-boost' | 'vocal' | 'rock' | 'pop' | 'jazz';

export interface EQBand {
  frequency: number;
  gain: number;
  label: string;
}

// Preset definitions: [60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz]
const EQ_PRESETS: Record<EQPreset, number[]> = {
  'flat':         [0,  0,  0,  0,  0],
  'bass-boost':   [6,  4,  0, -1, -2],
  'treble-boost': [-2, -1, 0,  4,  6],
  'vocal':        [-2,  0,  4,  3,  0],
  'rock':         [4,  2, -1,  3,  5],
  'pop':          [-1,  2,  4,  2, -1],
  'jazz':         [3,  1, -1,  2,  4],
};

const EQ_BANDS: EQBand[] = [
  { frequency: 60,   gain: 0, label: '60' },
  { frequency: 230,  gain: 0, label: '230' },
  { frequency: 910,  gain: 0, label: '910' },
  { frequency: 3600, gain: 0, label: '3.6k' },
  { frequency: 14000, gain: 0, label: '14k' },
];

interface SettingsStore {
  // Autoplay: continue playing similar content
  autoplay: boolean;
  setAutoplay: (v: boolean) => void;

  // Mono audio: merge L+R channels
  monoAudio: boolean;
  setMonoAudio: (v: boolean) => void;

  // Picture in Picture
  pictureInPicture: boolean;
  setPictureInPicture: (v: boolean) => void;

  // Equalizer
  eqEnabled: boolean;
  setEqEnabled: (v: boolean) => void;
  eqPreset: EQPreset;
  setEqPreset: (preset: EQPreset) => void;
  eqBands: EQBand[];
  setEqBandGain: (index: number, gain: number) => void;
}

export const EQ_PRESET_LABELS: Record<EQPreset, string> = {
  'flat': 'Flat',
  'bass-boost': 'Bass Boost',
  'treble-boost': 'Treble Boost',
  'vocal': 'Vocal',
  'rock': 'Rock',
  'pop': 'Pop',
  'jazz': 'Jazz',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoplay: true,
      setAutoplay: (v) => set({ autoplay: v }),

      monoAudio: false,
      setMonoAudio: (v) => set({ monoAudio: v }),

      pictureInPicture: false,
      setPictureInPicture: (v) => set({ pictureInPicture: v }),

      eqEnabled: false,
      setEqEnabled: (v) => set({ eqEnabled: v }),

      eqPreset: 'flat',
      setEqPreset: (preset) => {
        const gains = EQ_PRESETS[preset];
        set({
          eqPreset: preset,
          eqBands: EQ_BANDS.map((band, i) => ({ ...band, gain: gains[i] })),
        });
      },

      eqBands: [...EQ_BANDS],
      setEqBandGain: (index, gain) =>
        set((state) => ({
          eqBands: state.eqBands.map((b, i) =>
            i === index ? { ...b, gain } : b
          ),
          eqPreset: 'flat', // Custom gains reset preset label
        })),
    }),
    {
      name: 'sybau-settings-storage',
    }
  )
);

export { EQ_PRESETS, EQ_BANDS };
