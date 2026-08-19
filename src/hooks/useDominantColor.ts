import { useState, useEffect } from 'react';

export interface DominantPalette {
  /** Brightness-corrected accent — `rgb(r,g,b)` */
  accent: string;
  /** Soft alpha variant (~33% opacity) */
  accentSoft: string;
  /** Glow alpha variant (~55% opacity) */
  accentGlow: string;
  /** Raw `r,g,b` triplet — useful inside `rgba(<rgb>, alpha)` */
  rgb: string;
}

const FALLBACK: DominantPalette = {
  accent: 'rgb(29, 185, 84)', // Alerify green
  accentSoft: 'rgba(29, 185, 84, 0.2)',
  accentGlow: 'rgba(29, 185, 84, 0.35)',
  rgb: '29, 185, 84',
};

const ensureVisible = (r: number, g: number, b: number) => {
  // Perceived luminance
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 60) {
    // Lighten
    return [
      Math.min(255, r + 80),
      Math.min(255, g + 80),
      Math.min(255, b + 80),
    ] as const;
  }
  if (brightness > 200) {
    // Soften
    return [
      Math.round(r * 0.7),
      Math.round(g * 0.7),
      Math.round(b * 0.7),
    ] as const;
  }
  return [r, g, b] as const;
};

const buildPalette = (r: number, g: number, b: number): DominantPalette => {
  const [sr, sg, sb] = ensureVisible(r, g, b);
  const rgb = `${sr}, ${sg}, ${sb}`;
  return {
    accent: `rgb(${rgb})`,
    accentSoft: `rgba(${rgb}, 0.2)`,
    accentGlow: `rgba(${rgb}, 0.35)`,
    rgb,
  };
};

export function useDominantPalette(imageUrl: string | null): DominantPalette {
  const [palette, setPalette] = useState<DominantPalette>(FALLBACK);

  useEffect(() => {
    if (!imageUrl) {
      setPalette(FALLBACK);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Skip pure black/white
          if (brightness > 30 && brightness < 220) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count === 0) {
          setPalette(FALLBACK);
          return;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        setPalette(buildPalette(r, g, b));
      } catch (err) {
        console.warn('Color extract failed:', err);
        setPalette(FALLBACK);
      }
    };

    img.onerror = () => !cancelled && setPalette(FALLBACK);
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return palette;
}

/** Backwards-compatible wrapper: returns just the accent string. */
export function useDominantColor(imageUrl: string | null): string | null {
  const { accent } = useDominantPalette(imageUrl);
  return accent;
}
