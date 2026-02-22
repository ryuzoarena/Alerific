import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface CoverCropDialogProps {
  open: boolean;
  imageSrc: string;
  isGif?: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

function createCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.92
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export function CoverCropDialog({ open, imageSrc, isGif, onClose, onCropComplete }: CoverCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<Area | null>(null);

  const onCropAreaChange = useCallback((areaPercent: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
    setCroppedAreaPercent(areaPercent);
  }, []);

  const handleDone = async () => {
    try {
      if (isGif) {
        // For GIFs: keep original file to preserve animation
        const blob = await dataUrlToBlob(imageSrc);
        onCropComplete(blob);
      } else {
        if (!croppedAreaPixels) return;
        const blob = await createCroppedImage(imageSrc, croppedAreaPixels);
        onCropComplete(blob);
      }
    } catch (err) {
      console.error('Crop error:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 border-0 bg-background overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Batal
          </button>
          <h3 className="text-sm font-bold text-foreground">Atur Cover</h3>
          <button onClick={handleDone} className="text-sm font-semibold text-primary hover:text-primary/80">
            Selesai
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full aspect-square bg-black">
          {isGif ? (
            // Custom GIF cropper that preserves animation
            <GifCropper
              src={imageSrc}
              crop={crop}
              zoom={zoom}
              onCropChange={setCrop}
            />
          ) : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaChange}
              cropShape="rect"
              showGrid={false}
              style={{
                containerStyle: { width: '100%', height: '100%' },
                cropAreaStyle: { border: '2px solid hsl(var(--primary))', borderRadius: '8px' },
              }}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 py-4">
          <Minus size={16} className="text-muted-foreground shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
          <Plus size={16} className="text-muted-foreground shrink-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Lightweight GIF-friendly cropper using CSS transform so the animation stays alive */
function GifCropper({
  src,
  crop,
  zoom,
  onCropChange,
}: {
  src: string;
  crop: { x: number; y: number };
  zoom: number;
  onCropChange: (c: { x: number; y: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setLastPos({ x: e.clientX, y: e.clientY });
    onCropChange({ x: crop.x + dx, y: crop.y + dy });
  };

  const handlePointerUp = () => setDragging(false);

  return (
    <div
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={src}
        alt="GIF preview"
        draggable={false}
        className="pointer-events-none"
        style={{
          transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {/* Crop frame overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute border-2 rounded-lg"
          style={{
            border: '2px solid hsl(var(--primary))',
            inset: '0',
          }}
        />
      </div>
    </div>
  );
}
