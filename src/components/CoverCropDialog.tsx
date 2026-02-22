import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface CoverCropDialogProps {
  open: boolean;
  imageSrc: string;
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

export function CoverCropDialog({ open, imageSrc, onClose, onCropComplete }: CoverCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await createCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
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
