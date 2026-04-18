/**
 * Compress an image File to max 500x500 JPEG quality 0.85.
 * Returns the original file untouched for GIFs (preserves animation).
 */
export const compressImage = async (file: File): Promise<Blob> => {
  if (file.type === 'image/gif') return file;

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('image load failed'));
      img.src = url;
    });

    const MAX = 500;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      const ratio = Math.min(MAX / width, MAX / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.85);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};
