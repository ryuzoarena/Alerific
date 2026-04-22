import { useEffect } from 'react';
import { useSettingsStore, ACCENT_COLORS } from '@/stores/settingsStore';

const FONT_SIZE_PX: Record<string, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

/**
 * Applies persisted Settings (theme, accent, font size) to the document root.
 * Mount once at the app shell.
 */
export function useApplySettings() {
  const { themeMode, accentColor, fontSize } = useSettingsStore();

  // Theme mode (dark / light / system)
  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: light)');

    const apply = () => {
      const isLight =
        themeMode === 'light' || (themeMode === 'system' && mql.matches);
      root.classList.toggle('light', isLight);
      root.classList.toggle('dark', !isLight);
    };

    apply();
    if (themeMode === 'system') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
  }, [themeMode]);

  // Accent color → overrides --primary / --ring / --sidebar-primary
  useEffect(() => {
    const root = document.documentElement;
    const hsl = ACCENT_COLORS[accentColor].hsl;
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--sidebar-primary', hsl);
    root.style.setProperty('--track-progress', hsl);
  }, [accentColor]);

  // Font size scaling via root font-size
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_PX[fontSize] ?? '16px';
  }, [fontSize]);
}
