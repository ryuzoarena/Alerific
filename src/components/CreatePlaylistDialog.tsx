import { useRef, useState } from 'react';
import { Camera, Music2, X } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { compressImage } from '@/lib/imageCompress';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (playlistId: string) => void;
}

export function CreatePlaylistDialog({ isOpen, onClose, onCreated }: Props) {
  const isMobile = useIsMobile();
  const createPlaylist = useMusicStore((s) => s.createPlaylist);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mobile drag-to-dismiss
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handleClose = () => {
    setName('');
    setDescription('');
    setCoverPreview(null);
    setCoverFile(null);
    setDragOffset(0);
    onClose();
  };

  const handleFileSelect = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    let blob: Blob | undefined;
    if (coverFile) {
      try {
        blob = await compressImage(coverFile);
      } catch (e) {
        console.error(e);
      }
    }
    const playlist = await createPlaylist(name.trim(), description.trim() || undefined, blob);
    setSubmitting(false);
    if (playlist) {
      onCreated?.(playlist.id);
      handleClose();
    }
  };

  // Touch handlers (mobile only)
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = startYRef.current;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;
    if (diff > 0) setDragOffset(diff);
  };
  const onTouchEnd = () => {
    if (!isMobile) return;
    const diff = currentYRef.current - startYRef.current;
    if (diff > 120) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex"
      style={{
        background: 'rgba(0,0,0,0.6)',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn(
          'bg-[#1E1E1E] w-full text-white shadow-2xl',
          isMobile ? 'rounded-t-[20px] pb-6' : 'rounded-2xl max-w-md mx-4',
        )}
        style={{
          transform: isMobile ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset === 0 ? 'transform 0.25s ease' : 'none',
          maxHeight: isMobile ? '85vh' : undefined,
          touchAction: 'pan-y',
        }}
      >
        {/* Drag handle (mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>
        )}

        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-lg font-semibold">Create New Playlist</h2>
          {!isMobile && (
            <button onClick={handleClose} className="text-white/60 hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-5 space-y-4 overflow-y-auto" style={{ maxHeight: isMobile ? '60vh' : undefined }}>
          {/* Cover */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-[120px] h-[120px] rounded-lg overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center group"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <Music2 size={40} className="text-white/80" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs gap-1">
                <Camera size={20} />
                <span>Add Cover</span>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            autoFocus
            className="w-full h-11 px-4 rounded-lg text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div className="px-5 pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="w-full h-11 rounded-full bg-primary text-black text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
