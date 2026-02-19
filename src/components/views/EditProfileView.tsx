import { useState, useRef } from 'react';
import { X, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface EditProfileViewProps {
  onClose: () => void;
  userName: string;
  avatarUrl?: string | null;
  onProfileUpdate?: () => void;
}

export function EditProfileView({ onClose, userName, avatarUrl, onProfileUpdate }: EditProfileViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const initial = userName.charAt(0).toUpperCase();
  const [name, setName] = useState(userName);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('user_id', user.id);
      if (error) throw error;
      onProfileUpdate?.();
      toast({ title: 'Profil berhasil disimpan' });
      onClose();
    } catch {
      toast({ title: 'Gagal menyimpan profil', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setShowPhotoDialog(false);
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const newUrl = `${data.publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('user_id', user.id);

      setCurrentAvatarUrl(newUrl);
      onProfileUpdate?.();
      toast({ title: 'Foto profil berhasil diupload' });
    } catch {
      toast({ title: 'Gagal mengupload foto', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user) return;
    setShowPhotoDialog(false);
    setIsUploading(true);
    try {
      // List and remove all avatar files
      const { data: files } = await supabase.storage.from('avatars').list(user.id);
      if (files && files.length > 0) {
        await supabase.storage.from('avatars').remove(files.map(f => `${user.id}/${f.name}`));
      }
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      setCurrentAvatarUrl(null);
      onProfileUpdate?.();
      toast({ title: 'Foto profil dihapus' });
    } catch {
      toast({ title: 'Gagal menghapus foto', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Upload loading overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center gap-4">
          <Loader2 size={48} className="text-foreground animate-spin" />
          <p className="text-foreground text-lg font-medium">Mengupload foto...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <button onClick={onClose}>
          <X size={24} className="text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Edit profil</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mt-8 mb-8">
        <div className="relative">
          <div className="w-36 h-36 rounded-full overflow-hidden"
            style={{ backgroundColor: 'hsl(210, 60%, 70%)' }}>
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl font-bold text-black">{initial}</span>
              </div>
            )}
          </div>
          {/* Pen button */}
          <button
            onClick={() => setShowPhotoDialog(true)}
            className="absolute bottom-1 right-1 w-9 h-9 rounded-lg bg-foreground flex items-center justify-center shadow-lg"
          >
            <Pencil size={16} className="text-background" />
          </button>
        </div>
      </div>

      {/* Name field */}
      <div className="px-5">
        <div className="flex items-center gap-4 py-4 border-b border-border/50">
          <span className="text-sm font-bold text-foreground w-16">Nama</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm outline-none"
          />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
      />

      {/* Photo options dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl bg-card border-0 p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="text-lg font-bold text-foreground">
              Tambahkan gambar profil
            </DialogTitle>
          </DialogHeader>
          <div className="pb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-5 py-3.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
            >
              Upload dari fotomu
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-5 py-3.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
            >
              Ambil foto
            </button>
            <button
              onClick={handleDeletePhoto}
              disabled={!currentAvatarUrl}
              className={cn(
                "w-full text-left px-5 py-3.5 text-sm transition-colors",
                currentAvatarUrl ? "text-foreground hover:bg-accent/50" : "text-muted-foreground/50"
              )}
            >
              Hapus foto saat ini
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
