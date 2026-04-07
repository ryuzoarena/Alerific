import { useState, useRef } from 'react';
import { X, Upload, Music, Image, FileText, AlertTriangle } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { Song, LyricLine } from '@/types/music';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { uploadAudioFile, uploadCoverImage, getAudioUrl, getCoverUrl } from '@/lib/cloudStorage';
import { CoverCropDialog } from '@/components/CoverCropDialog';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const { addSong } = useMusicStore();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [forceUpload, setForceUpload] = useState(false);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setTitle(fileName);
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      URL.revokeObjectURL(url);
    };
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImageSrc(ev.target?.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isRawGif = rawImageSrc.startsWith('data:image/gif');

  const handleCropComplete = (croppedBlob: Blob) => {
    const ext = isRawGif ? 'gif' : 'jpg';
    const mime = isRawGif ? 'image/gif' : 'image/jpeg';
    const file = new File([croppedBlob], `cover.${ext}`, { type: mime });
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(croppedBlob));
    setShowCropDialog(false);
    setRawImageSrc('');
  };

  const parseLyrics = (content: string): LyricLine[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const lyrics: LyricLine[] = [];
    const lrcPattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    for (const line of lines) {
      const match = line.match(lrcPattern);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = line.replace(lrcPattern, '').trim();
        if (text) lyrics.push({ time, text });
      } else if (!line.startsWith('[')) {
        lyrics.push({ time: lyrics.length * 5, text: line.trim() });
      }
    }
    return lyrics;
  };

  const handleLyricsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLyricsFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setParsedLyrics(parseLyrics(content));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!audioFile || !title) return;

    // Check for duplicates unless user forced upload
    if (!forceUpload) {
      const trimmedTitle = title.trim().toLowerCase();
      const trimmedArtist = (artist.trim() || 'Unknown Artist').toLowerCase();
      
      // Check in database
      const { data: existing } = await supabase
        .from('songs')
        .select('id, title, artist')
        .ilike('title', trimmedTitle)
        .ilike('artist', trimmedArtist)
        .limit(1);
      
      if (existing && existing.length > 0) {
        setDuplicateWarning(`"${existing[0].title}" oleh ${existing[0].artist} sudah ada di library.`);
        return;
      }
      
      // Also check in local store
      const localSongs = useMusicStore.getState().songs;
      const localDuplicate = localSongs.find(
        s => s.title.toLowerCase() === trimmedTitle && s.artist.toLowerCase() === trimmedArtist
      );
      if (localDuplicate) {
        setDuplicateWarning(`"${localDuplicate.title}" oleh ${localDuplicate.artist} sudah ada di library.`);
        return;
      }
    }
    
    setDuplicateWarning(null);
    setForceUpload(false);
    setIsProcessing(true);

    try {
      const songId = crypto.randomUUID();
      
      // Create local blob URLs for instant playback
      const localAudioUrl = URL.createObjectURL(audioFile);
      const localCoverUrl = coverFile ? URL.createObjectURL(coverFile) : undefined;

      // Add song immediately with local URLs for instant playback
      const newSong: Song = {
        id: songId,
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        album: album.trim() || undefined,
        duration: duration || 180,
        audio_path: '', // Will be updated after upload
        cover_path: undefined,
        audioUrl: localAudioUrl,
        coverUrl: localCoverUrl,
        lyrics: parsedLyrics.length > 0 ? parsedLyrics : [],
        addedAt: Date.now(),
      };

      addSong(newSong);
      resetForm();
      onClose();

      // Upload to cloud in background (non-blocking)
      (async () => {
        try {
          const audioPath = await uploadAudioFile(songId, audioFile);
          
          let coverPath: string | undefined;
          if (coverFile) {
            coverPath = await uploadCoverImage(songId, coverFile);
          }

          // Insert metadata into database
          await supabase.from('songs').insert({
            id: songId,
            title: newSong.title,
            artist: newSong.artist,
            album: newSong.album || null,
            duration: newSong.duration,
            audio_path: audioPath,
            cover_path: coverPath || null,
            lyrics: parsedLyrics.length > 0 ? JSON.stringify(parsedLyrics) : null,
          } as any);

          // Update song in store with cloud URLs
          useMusicStore.setState((state) => ({
            songs: state.songs.map(s => 
              s.id === songId 
                ? { 
                    ...s, 
                    audio_path: audioPath, 
                    cover_path: coverPath,
                    audioUrl: getAudioUrl(audioPath), 
                    coverUrl: coverPath ? getCoverUrl(coverPath) : s.coverUrl,
                  } 
                : s
            ),
          }));
        } catch (error) {
          console.error('Background upload failed:', error);
        }
      })();
    } catch (error) {
      console.error('Error adding song:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview('');
    setRawImageSrc('');
    setShowCropDialog(false);
    setLyricsFile(null);
    setParsedLyrics([]);
    setTitle('');
    setArtist('');
    setAlbum('');
    setDuration(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-md mx-auto p-4 md:p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold">Add Music</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-accent transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Audio Upload */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium mb-2">Audio File *</label>
          <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
          {audioFile ? (
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Music size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setAudioFile(null); setTitle(''); setDuration(0); }} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => audioInputRef.current?.click()} className="w-full p-4 md:p-6 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-2">
              <Upload size={28} className="md:w-8 md:h-8 text-muted-foreground" />
              <span className="text-xs md:text-sm text-muted-foreground text-center">Click to upload MP3, WAV, or other audio</span>
            </button>
          )}
        </div>

        {/* Cover Image and Lyrics */}
        <div className="grid grid-cols-2 gap-4 mb-4 md:mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Album Art</label>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <button onClick={() => imageInputRef.current?.click()} className={cn("w-full aspect-square rounded-lg overflow-hidden transition-all", coverPreview ? "ring-2 ring-primary" : "border-2 border-dashed border-border hover:border-primary hover:bg-primary/5")}>
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                  <Image size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">Add cover</span>
                </div>
              )}
            </button>
            {coverPreview && (
              <button onClick={() => { setCoverFile(null); setCoverPreview(''); }} className="text-xs text-muted-foreground hover:text-destructive mt-1">Remove</button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lyrics</label>
            <input ref={lyricsInputRef} type="file" accept=".lrc,.txt" onChange={handleLyricsSelect} className="hidden" />
            <button onClick={() => lyricsInputRef.current?.click()} className={cn("w-full aspect-square rounded-lg overflow-hidden transition-all", lyricsFile ? "ring-2 ring-primary bg-primary/10" : "border-2 border-dashed border-border hover:border-primary hover:bg-primary/5")}>
              {lyricsFile ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                  <FileText size={24} className="text-primary" />
                  <span className="text-xs text-primary text-center truncate w-full px-2">{lyricsFile.name}</span>
                  <span className="text-xs text-muted-foreground">{parsedLyrics.length} lines</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                  <FileText size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">Add lyrics (.lrc/.txt)</span>
                </div>
              )}
            </button>
            {lyricsFile && (
              <button onClick={() => { setLyricsFile(null); setParsedLyrics([]); }} className="text-xs text-muted-foreground hover:text-destructive mt-1">Remove</button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Artist</label>
            <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Album</label>
            <input type="text" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album name" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleClose} className="flex-1 px-4 py-2 text-sm font-medium rounded-full hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={!audioFile || !title || isProcessing} className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
            {isProcessing ? 'Uploading...' : 'Add Song'}
          </button>
        </div>
      </div>

      {/* Cover Crop Dialog */}
      <CoverCropDialog
        open={showCropDialog}
        imageSrc={rawImageSrc}
        isGif={isRawGif}
        onClose={() => { setShowCropDialog(false); setRawImageSrc(''); }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
