import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Music, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { uploadAudioFile, uploadCoverImage, getAudioUrl, getCoverUrl } from '@/lib/cloudStorage';
import { extractMetadata } from '@/lib/metadataExtractor';
import { toast } from 'sonner';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_EXT = ['mp3', 'wav', 'flac', 'ogg', 'm4a'];
const PARALLEL_UPLOADS = 3;

type UploadStatus = 'queued' | 'extracting' | 'uploading' | 'processing' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverBlob?: Blob;
  coverPreview?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  startedAt?: number;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isValidAudio = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ACCEPTED_EXT.includes(ext);
};

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const { addSong } = useMusicStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup preview URLs on unmount/close
  useEffect(() => {
    return () => {
      items.forEach((it) => it.coverPreview && URL.revokeObjectURL(it.coverPreview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addFiles = useCallback(async (files: File[]) => {
    const valid: UploadItem[] = [];
    for (const file of files) {
      if (!isValidAudio(file)) {
        toast.error(`${file.name}: format tidak didukung`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: melebihi 50MB`);
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: '',
        duration: 0,
        status: 'extracting',
        progress: 0,
      });
    }
    if (valid.length === 0) return;
    setItems((prev) => [...prev, ...valid]);

    // Extract metadata in parallel (non-blocking)
    valid.forEach(async (item) => {
      try {
        const meta = await extractMetadata(item.file);
        updateItem(item.id, {
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          duration: meta.duration,
          coverBlob: meta.coverBlob,
          coverPreview: meta.coverPreview,
          status: 'queued',
        });
      } catch {
        updateItem(item.id, { status: 'queued' });
      }
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.coverPreview) URL.revokeObjectURL(target.coverPreview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const uploadOne = async (item: UploadItem): Promise<void> => {
    updateItem(item.id, { status: 'uploading', progress: 5, startedAt: Date.now() });

    try {
      const songId = crypto.randomUUID();
      const songTitle = item.title.trim() || item.file.name;
      const songArtist = item.artist.trim() || 'Unknown Artist';
      const songAlbum = item.album.trim() || undefined;
      const songDuration = item.duration || 180;

      // Simulate smooth progress while parallel uploads run
      let fakeProgress = 5;
      const progressTimer = setInterval(() => {
        fakeProgress = Math.min(85, fakeProgress + Math.random() * 8);
        updateItem(item.id, { progress: fakeProgress });
      }, 250);

      const coverFile = item.coverBlob
        ? new File(
            [item.coverBlob],
            `cover.${item.coverBlob.type === 'image/gif' ? 'gif' : 'jpg'}`,
            { type: item.coverBlob.type }
          )
        : undefined;

      const [audioPath, coverPath] = await Promise.all([
        uploadAudioFile(songId, item.file),
        coverFile ? uploadCoverImage(songId, coverFile) : Promise.resolve(undefined),
      ]);

      clearInterval(progressTimer);
      updateItem(item.id, { status: 'processing', progress: 92 });

      const { error: insertError } = await supabase.from('songs').insert({
        id: songId,
        title: songTitle,
        artist: songArtist,
        album: songAlbum || null,
        duration: songDuration,
        audio_path: audioPath,
        cover_path: coverPath || null,
        lyrics: null,
      } as any);

      if (insertError) throw insertError;

      const newSong: Song = {
        id: songId,
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        duration: songDuration,
        audio_path: audioPath,
        cover_path: coverPath,
        audioUrl: getAudioUrl(audioPath),
        coverUrl: coverPath ? getCoverUrl(coverPath) : undefined,
        lyrics: [],
        addedAt: Date.now(),
      };

      addSong(newSong);
      updateItem(item.id, { status: 'done', progress: 100 });
      toast.success(`✓ ${songTitle} berhasil diupload`);
    } catch (err: any) {
      console.error('Upload error:', err);
      updateItem(item.id, {
        status: 'error',
        error: err?.message || 'Upload gagal',
      });
      toast.error(`Gagal upload ${item.title}`);
    }
  };

  const startUpload = async () => {
    const pending = items.filter((it) => it.status === 'queued' || it.status === 'error');
    if (pending.length === 0) return;
    setIsUploading(true);

    // Upload in batches of PARALLEL_UPLOADS
    for (let i = 0; i < pending.length; i += PARALLEL_UPLOADS) {
      const batch = pending.slice(i, i + PARALLEL_UPLOADS);
      await Promise.all(batch.map(uploadOne));
    }

    setIsUploading(false);
  };

  const handleClose = () => {
    if (isUploading) return;
    items.forEach((it) => it.coverPreview && URL.revokeObjectURL(it.coverPreview));
    setItems([]);
    onClose();
  };

  const clearDone = () => {
    setItems((prev) => {
      prev.filter((p) => p.status === 'done').forEach((p) => {
        if (p.coverPreview) URL.revokeObjectURL(p.coverPreview);
      });
      return prev.filter((p) => p.status !== 'done');
    });
  };

  if (!isOpen) return null;

  const pendingCount = items.filter((it) => it.status === 'queued' || it.status === 'error').length;
  const doneCount = items.filter((it) => it.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-auto p-4 md:p-6 animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Upload Music</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              MP3, WAV, FLAC, OGG, M4A · max 50MB · multi-file
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1 rounded-full hover:bg-accent transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.flac,.ogg,.m4a,audio/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 transition-all',
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border hover:border-primary hover:bg-primary/5'
          )}
        >
          <Upload size={32} className={cn('transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground')} />
          <span className="text-sm font-medium">
            {isDragging ? 'Drop file di sini' : 'Drag & drop atau klik untuk pilih file'}
          </span>
          <span className="text-xs text-muted-foreground">Bisa pilih banyak file sekaligus</span>
        </button>

        {/* File List */}
        {items.length > 0 && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <UploadRow key={item.id} item={item} onRemove={() => removeItem(item.id)} />
            ))}
          </div>
        )}

        {/* Actions */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <div className="flex-1 text-xs text-muted-foreground">
              {pendingCount > 0 && <span>{pendingCount} menunggu · </span>}
              {doneCount > 0 && <span className="text-green-500">{doneCount} selesai</span>}
            </div>
            {doneCount > 0 && !isUploading && (
              <button
                onClick={clearDone}
                className="px-3 py-1.5 text-xs font-medium rounded-full hover:bg-accent transition-colors"
              >
                Bersihkan
              </button>
            )}
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium rounded-full hover:bg-accent transition-colors disabled:opacity-50"
            >
              Tutup
            </button>
            <button
              onClick={startUpload}
              disabled={pendingCount === 0 || isUploading}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Mengupload...
                </>
              ) : (
                `Upload ${pendingCount}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadRow({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  const statusColor = {
    queued: 'bg-muted-foreground/40',
    extracting: 'bg-blue-400',
    uploading: 'bg-blue-500',
    processing: 'bg-yellow-500',
    done: 'bg-green-500',
    error: 'bg-destructive',
  }[item.status];

  const StatusIcon = () => {
    switch (item.status) {
      case 'done':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-destructive" />;
      case 'extracting':
      case 'uploading':
      case 'processing':
        return <Loader2 size={16} className="animate-spin text-primary" />;
      default:
        return <Music size={16} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-2.5 bg-secondary/50 rounded-lg">
      {/* Cover thumbnail */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
        {item.coverPreview ? (
          <img src={item.coverPreview} alt="" className="w-full h-full object-cover" />
        ) : (
          <Music size={16} className="text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.title}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {item.artist} · {formatBytes(item.file.size)}
          {item.error && <span className="text-destructive ml-1">· {item.error}</span>}
        </p>
        {(item.status === 'uploading' || item.status === 'processing' || item.status === 'done') && (
          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-200', statusColor)}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <StatusIcon />
        {item.status !== 'uploading' && item.status !== 'processing' && (
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
