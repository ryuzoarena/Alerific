/**
 * Prepare a user-picked wallpaper for use as the app background.
 * Downscales to max 1920px on the long edge and returns a JPEG data URL,
 * small enough to keep in localStorage. GIFs are kept as-is (animation).
 */
export const prepareBackgroundImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.type === 'image/gif') {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1920;
      let { width, height } = img;
      const ratio = Math.min(1, MAX / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error('canvas unavailable'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
