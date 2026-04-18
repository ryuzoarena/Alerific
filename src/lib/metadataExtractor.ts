import { parseBlob } from 'music-metadata-browser';

export interface ExtractedMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverBlob?: Blob;
  coverPreview?: string;
}

/**
 * Compress an image blob to max 500x500 JPEG quality 0.85.
 * Preserves GIFs as-is (no canvas to keep animation).
 */
const compressCover = async (blob: Blob): Promise<Blob> => {
  if (blob.type === 'image/gif') return blob;

  const img = new Image();
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('img load failed'));
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
    if (!ctx) return blob;
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || blob), 'image/jpeg', 0.85);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const extractMetadata = async (file: File): Promise<ExtractedMetadata> => {
  const fallbackTitle = file.name.replace(/\.[^/.]+$/, '');

  try {
    const meta = await parseBlob(file);
    const picture = meta.common.picture?.[0];
    let coverBlob: Blob | undefined;
    let coverPreview: string | undefined;

    if (picture) {
      const raw = new Blob([picture.data], { type: picture.format || 'image/jpeg' });
      coverBlob = await compressCover(raw);
      coverPreview = URL.createObjectURL(coverBlob);
    }

    return {
      title: meta.common.title || fallbackTitle,
      artist: meta.common.artist || 'Unknown Artist',
      album: meta.common.album || '',
      duration: meta.format.duration || 0,
      coverBlob,
      coverPreview,
    };
  } catch (err) {
    console.warn('Metadata parse failed, using fallback', err);
    // Fallback: just decode duration via Audio element
    const duration = await new Promise<number>((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(url);
      };
      audio.src = url;
    });

    return {
      title: fallbackTitle,
      artist: 'Unknown Artist',
      album: '',
      duration,
    };
  }
};
