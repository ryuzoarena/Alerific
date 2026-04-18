import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, Music, CheckCircle2, AlertCircle, Loader2, Trash2,
  ChevronDown, ChevronUp, Image as ImageIcon, FileText,
} from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { Song, LyricLine } from '@/types/music';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { uploadAudioFile, uploadCoverImage, getAudioUrl, getCoverUrl } from '@/lib/cloudStorage';
import { extractMetadata } from '@/lib/metadataExtractor';
import { compressImage } from '@/lib/imageCompress';
import { parseLyrics, isLRC } from '@/lib/lyricsParser';
import { toast } from 'sonner';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const MAX_LYRICS_CHARS = 10000;
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
  lyricsText: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  expanded?: boolean;
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
        lyricsText: '',
        status: 'extracting',
        progress: 0,
      });
    }
    if (valid.length === 0) return;
    setItems((prev) => [...prev, ...valid]);

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
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.coverPreview) URL.revokeObjectURL(target.coverPreview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const replaceCover = async (id: string, file: File) => {
    if (file.size > MAX_COVER_SIZE) {
      toast.error('Cover melebihi 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Cover harus berupa gambar');
      return;
    }
    const item = items.find((it) => it.id === id);
    if (item?.coverPreview) URL.revokeObjectURL(item.coverPreview);
    const compressed = await compressImage(file);
    updateItem(id, {
      coverBlob: compressed,
      coverPreview: URL.createObjectURL(compressed),
    });
  };

  const importLrcFile = async (id: string, file: File) => {
    const text = await file.text();
    if (text.length > MAX_LYRICS_CHARS) {
      toast.error(`Lyrics melebihi ${MAX_LYRICS_CHARS.toLocaleString()} karakter`);
      return;
    }
    updateItem(id, { lyricsText: text });
  };

  const uploadOne = async (item: UploadItem): Promise<void> => {
    updateItem(item.id, { status: 'uploading', progress: 5 });

    try {
      const songId = crypto.randomUUID();
      const songTitle = item.title.trim() || item.file.name;
      const songArtist = item.artist.trim() || 'Unknown Artist';
      const songAlbum = item.album.trim() || undefined;
      const songDuration = item.duration || 180;
      const parsedLyrics: LyricLine[] = parseLyrics(item.lyricsText);

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
        lyrics: parsedLyrics.length > 0 ? JSON.stringify(parsedLyrics) : null,
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
        lyrics: parsedLyrics,
        addedAt: Date.now(),
      };

      addSong(newSong);
      updateItem(item.id, { status: 'done', progress: 100 });
      toast.success(`✓ ${songTitle} berhasil diupload`);
    } catch (err: any) {
      console.error('Upload error:', err);
      updateItem(item.id, { status: 'error', error: err?.message || 'Upload gagal' });
      toast.error(`Gagal upload ${item.title}`);
    }
  };

  const startUpload = async () => {
    const pending = items.filter((it) => it.status === 'queued' || it.status === 'error');
    if (pending.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < pending.length; i += PARALLEL_UPLOADS) {
      await Promise.all(pending.slice(i, i + PARALLEL_UPLOADS).map(uploadOne));
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
              MP3, WAV, FLAC, OGG, M4A · max 50MB · cover & lyrics per lagu
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
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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

        {items.length > 0 && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <UploadRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onToggleExpand={() => updateItem(item.id, { expanded: !item.expanded })}
                onPatch={(patch) => updateItem(item.id, patch)}
                onReplaceCover={(file) => replaceCover(item.id, file)}
                onImportLrc={(file) => importLrcFile(item.id, file)}
              />
            ))}
          </div>
        )}

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
                <><Loader2 size={14} className="animate-spin" /> Mengupload...</>
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

interface UploadRowProps {
  item: UploadItem;
  onRemove: () => void;
  onToggleExpand: () => void;
  onPatch: (patch: Partial<UploadItem>) => void;
  onReplaceCover: (file: File) => void;
  onImportLrc: (file: File) => void;
}

function UploadRow({ item, onRemove, onToggleExpand, onPatch, onReplaceCover, onImportLrc }: UploadRowProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);
  const isLocked = item.status === 'uploading' || item.status === 'processing' || item.status === 'done';

  const statusBar = {
    queued: 'bg-muted-foreground/40',
    extracting: 'bg-blue-400',
    uploading: 'bg-blue-500',
    processing: 'bg-yellow-500',
    done: 'bg-green-500',
    error: 'bg-destructive',
  }[item.status];

  const StatusIcon = () => {
    switch (item.status) {
      case 'done': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'error': return <AlertCircle size={16} className="text-destructive" />;
      case 'extracting':
      case 'uploading':
      case 'processing': return <Loader2 size={16} className="animate-spin text-primary" />;
      default: return <Music size={16} className="text-muted-foreground" />;
    }
  };

  const lyricsLen = item.lyricsText.length;
  const lyricsColor =
    lyricsLen >= MAX_LYRICS_CHARS ? 'text-destructive' :
    lyricsLen >= 8000 ? 'text-yellow-500' : 'text-muted-foreground';
  const detectedFormat = item.lyricsText ? (isLRC(item.lyricsText) ? 'LRC' : 'Plain') : null;

  return (
    <div className="bg-secondary/50 rounded-lg overflow-hidden">
      {/* Compact row */}
      <div className="flex items-center gap-3 p-2.5">
        <button
          type="button"
          onClick={() => !isLocked && coverInputRef.current?.click()}
          disabled={isLocked}
          className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center group relative disabled:cursor-not-allowed"
          title={isLocked ? '' : 'Klik untuk ganti cover'}
        >
          {item.coverPreview ? (
            <img src={item.coverPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={16} className="text-muted-foreground" />
          )}
          {!isLocked && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ImageIcon size={14} className="text-white" />
            </div>
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onReplaceCover(f);
            e.target.value = '';
          }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.artist} · {formatBytes(item.file.size)}
            {item.lyricsText && <span className="text-primary"> · 📜 lyrics</span>}
            {item.error && <span className="text-destructive ml-1">· {item.error}</span>}
          </p>
          {(item.status === 'uploading' || item.status === 'processing' || item.status === 'done') && (
            <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full transition-all duration-200', statusBar)} style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <StatusIcon />
          {!isLocked && (
            <>
              <button
                onClick={onToggleExpand}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Edit detail"
              >
                {item.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded edit panel */}
      {item.expanded && !isLocked && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2">
            <FieldInput label="Title" value={item.title} onChange={(v) => onPatch({ title: v })} />
            <FieldInput label="Artist" value={item.artist} onChange={(v) => onPatch({ artist: v })} />
            <FieldInput label="Album" value={item.album} onChange={(v) => onPatch({ album: v })} />
            <div>
              <label className="block text-[11px] font-medium mb-1 text-muted-foreground">Cover</label>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full px-3 py-2 bg-background/50 hover:bg-background rounded-lg text-xs flex items-center gap-2 border border-border/50 transition-colors"
              >
                <ImageIcon size={12} />
                {item.coverBlob ? 'Ganti cover' : 'Tambah cover (max 5MB)'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Lyrics (optional)
                {detectedFormat && (
                  <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                    {detectedFormat}
                  </span>
                )}
              </label>
              <button
                onClick={() => lrcInputRef.current?.click()}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <FileText size={11} /> Import .lrc
              </button>
              <input
                ref={lrcInputRef}
                type="file"
                accept=".lrc,.txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportLrc(f);
                  e.target.value = '';
                }}
              />
            </div>
            <textarea
              value={item.lyricsText}
              onChange={(e) => {
                const v = e.target.value.slice(0, MAX_LYRICS_CHARS);
                onPatch({ lyricsText: v });
              }}
              placeholder={`Paste lyrics here...\n\nUntuk lyrics ber-timestamp gunakan format LRC:\n[0:00] line one\n[0:08] line two`}
              className="w-full min-h-[150px] p-3 bg-background/50 border border-border/50 rounded-lg text-[13px] font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className={cn('text-[11px] mt-1 text-right', lyricsColor)}>
              {lyricsLen.toLocaleString()} / {MAX_LYRICS_CHARS.toLocaleString()} characters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1 text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
