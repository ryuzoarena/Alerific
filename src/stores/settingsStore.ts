import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EQPreset = 'flat' | 'bass-boost' | 'pop' | 'rock' | 'jazz' | 'classical';
export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'green' | 'blue' | 'purple' | 'red' | 'yellow';
export type FontSize = 'small' | 'medium' | 'large';
export type StreamingQuality = 'low' | 'normal' | 'high' | 'lossless';
export type Language = 'id' | 'en' | 'ja' | 'ko';

export interface EQBand {
  frequency: number;
  gain: number;
  label: string;
}

const EQ_BANDS: EQBand[] = [
  { frequency: 60,    gain: 0, label: '60' },
  { frequency: 170,   gain: 0, label: '170' },
  { frequency: 310,   gain: 0, label: '310' },
  { frequency: 600,   gain: 0, label: '600' },
  { frequency: 1000,  gain: 0, label: '1k' },
  { frequency: 3000,  gain: 0, label: '3k' },
  { frequency: 6000,  gain: 0, label: '6k' },
  { frequency: 12000, gain: 0, label: '12k' },
  { frequency: 14000, gain: 0, label: '14k' },
  { frequency: 16000, gain: 0, label: '16k' },
];

// 10-band presets
const EQ_PRESETS: Record<EQPreset, number[]> = {
  'flat':       [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  'bass-boost': [ 7,  6,  4,  2,  0, -1, -1,  0,  1,  2],
  'pop':        [-1,  1,  3,  4,  3,  1, -1, -1,  0,  1],
  'rock':       [ 5,  4,  2, -1, -2,  1,  3,  4,  4,  5],
  'jazz':       [ 3,  2,  1,  2,  1, -1, -1,  0,  2,  3],
  'classical':  [ 4,  3,  2,  1,  0,  0,  1,  2,  3,  4],
};

export const EQ_PRESET_LABELS: Record<EQPreset, string> = {
  'flat': 'Flat',
  'bass-boost': 'Bass Boost',
  'pop': 'Pop',
  'rock': 'Rock',
  'jazz': 'Jazz',
  'classical': 'Classical',
};

export const ACCENT_COLORS: Record<AccentColor, { hsl: string; label: string; swatch: string }> = {
  green:  { hsl: '141 73% 42%', label: 'Hijau',  swatch: '#1DB954' },
  blue:   { hsl: '212 92% 55%', label: 'Biru',   swatch: '#2A8AF6' },
  purple: { hsl: '270 75% 60%', label: 'Ungu',   swatch: '#A855F7' },
  red:    { hsl: '0 75% 58%',   label: 'Merah',  swatch: '#EF4444' },
  yellow: { hsl: '45 95% 55%',  label: 'Kuning', swatch: '#F5C518' },
};

export const LANGUAGE_LABELS: Record<Language, { flag: string; label: string }> = {
  id: { flag: '🇮🇩', label: 'Bahasa Indonesia' },
  en: { flag: '🇬🇧', label: 'English' },
  ja: { flag: '🇯🇵', label: '日本語' },
  ko: { flag: '🇰🇷', label: '한국어' },
};

interface SettingsStore {
  // Listening controls
  autoplay: boolean;
  setAutoplay: (v: boolean) => void;
  monoAudio: boolean;
  setMonoAudio: (v: boolean) => void;

  // Equalizer
  eqEnabled: boolean;
  setEqEnabled: (v: boolean) => void;
  eqPreset: EQPreset;
  setEqPreset: (preset: EQPreset) => void;
  eqBands: EQBand[];
  setEqBandGain: (index: number, gain: number) => void;

  // Appearance
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;

  // Audio quality
  streamingQuality: StreamingQuality;
  setStreamingQuality: (q: StreamingQuality) => void;
  crossfadeSeconds: number;
  setCrossfadeSeconds: (n: number) => void;
  normalizeVolume: boolean;
  setNormalizeVolume: (v: boolean) => void;

  // Keyboard shortcuts
  keyboardShortcutsEnabled: boolean;
  setKeyboardShortcutsEnabled: (v: boolean) => void;

  // Language
  language: Language;
  setLanguage: (l: Language) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoplay: true,
      setAutoplay: (v) => set({ autoplay: v }),

      monoAudio: false,
      setMonoAudio: (v) => set({ monoAudio: v }),

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
          eqBands: state.eqBands.map((b, i) => (i === index ? { ...b, gain } : b)),
          eqPreset: 'flat',
        })),

      themeMode: 'dark',
      setThemeMode: (m) => set({ themeMode: m }),

      accentColor: 'green',
      setAccentColor: (c) => set({ accentColor: c }),

      fontSize: 'medium',
      setFontSize: (s) => set({ fontSize: s }),

      streamingQuality: 'high',
      setStreamingQuality: (q) => set({ streamingQuality: q }),

      crossfadeSeconds: 0,
      setCrossfadeSeconds: (n) => set({ crossfadeSeconds: Math.max(0, Math.min(12, n)) }),

      normalizeVolume: false,
      setNormalizeVolume: (v) => set({ normalizeVolume: v }),

      keyboardShortcutsEnabled: true,
      setKeyboardShortcutsEnabled: (v) => set({ keyboardShortcutsEnabled: v }),

      language: 'id',
      setLanguage: (l) => set({ language: l }),
    }),
    {
      name: 'sybau-settings-storage',
      version: 2,
      // If old persisted state has 5-band EQ, reset bands to new 10-band layout.
      migrate: (persisted: any, fromVersion) => {
        if (!persisted) return persisted;
        if (fromVersion < 2 || !Array.isArray(persisted.eqBands) || persisted.eqBands.length !== 10) {
          persisted.eqBands = [...EQ_BANDS];
          persisted.eqPreset = 'flat';
        }
        return persisted;
      },
    }
  )
);

export { EQ_PRESETS, EQ_BANDS };
