import { useState, useRef } from 'react';
import { X, Upload, Music, Image, Plus } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const { addSong } = useMusicStore();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    
    // Create object URL for the audio
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Extract filename as title
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setTitle(fileName);
    
    // Try to get duration
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!audioFile || !title) return;

    setIsProcessing(true);

    try {
      // Read audio file as blob
      const audioBlob = audioFile;
      
      const newSong: Song = {
        id: crypto.randomUUID(),
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        album: album.trim() || undefined,
        duration: duration || 180,
        coverUrl: coverPreview || undefined,
        audioBlob,
        audioUrl,
        addedAt: Date.now(),
        lyrics: [],
      };

      addSong(newSong);
      
      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding song:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setAudioUrl('');
    setCoverFile(null);
    setCoverPreview('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Music</h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Audio Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Audio File *</label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioSelect}
            className="hidden"
          />
          
          {audioFile ? (
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Music size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setAudioFile(null);
                  setAudioUrl('');
                  setTitle('');
                  setDuration(0);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-2"
            >
              <Upload size={32} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload MP3, WAV, or other audio
              </span>
            </button>
          )}
        </div>

        {/* Cover Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Album Art (optional)</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <div className="flex gap-4">
            <button
              onClick={() => imageInputRef.current?.click()}
              className={cn(
                "w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 transition-all",
                coverPreview 
                  ? "ring-2 ring-primary" 
                  : "border-2 border-dashed border-border hover:border-primary hover:bg-primary/5"
              )}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <Image size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </div>
              )}
            </button>
            
            {coverPreview && (
              <button
                onClick={() => {
                  setCoverFile(null);
                  setCoverPreview('');
                }}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Album</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Album name"
              className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-full hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!audioFile || !title || isProcessing}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {isProcessing ? 'Adding...' : 'Add Song'}
          </button>
        </div>
      </div>
    </div>
  );
}
