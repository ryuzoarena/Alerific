import { useState, useEffect } from 'react';

export function useDominantColor(imageUrl: string | null): string | null {
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setDominantColor(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sample a small area for performance
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50);
        const data = imageData.data;

        // Calculate average color with weighted sampling
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          // Skip very dark and very light pixels
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 30 && brightness < 220) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          
          // Darken the color slightly for better visibility
          r = Math.round(r * 0.6);
          g = Math.round(g * 0.6);
          b = Math.round(b * 0.6);
          
          setDominantColor(`rgb(${r}, ${g}, ${b})`);
        } else {
          setDominantColor('rgb(68, 44, 44)'); // Fallback brownish color
        }
      } catch (error) {
        console.error('Error extracting color:', error);
        setDominantColor('rgb(68, 44, 44)');
      }
    };

    img.onerror = () => {
      setDominantColor('rgb(68, 44, 44)');
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return dominantColor;
}
