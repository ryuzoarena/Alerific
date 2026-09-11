import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Full-screen custom wallpaper layer. Sits behind the whole app.
 */
export function AppBackground() {
  const { customBackground, backgroundBlur, backgroundDim } = useSettingsStore();

  if (!customBackground) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${customBackground})`,
          filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
          transform: backgroundBlur > 0 ? 'scale(1.06)' : undefined,
        }}
      />
      <div
        className="absolute inset-0 bg-background"
        style={{ opacity: backgroundDim / 100 }}
      />
    </div>
  );
}
