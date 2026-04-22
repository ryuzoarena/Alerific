import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Settings, Palette, Headphones, Keyboard, Languages, User as UserIcon,
  HardDrive, Sun, Moon, Monitor, Loader2, Pencil, Trash2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useSettingsStore, EQ_PRESET_LABELS, EQPreset, ACCENT_COLORS,
  AccentColor, ThemeMode, FontSize, StreamingQuality, Language, LANGUAGE_LABELS,
} from '@/stores/settingsStore';
import { useMusicStore } from '@/stores/musicStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ---------- shared building blocks ---------- */

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="border-t border-border/60 pt-3">{children}</div>
    </section>
  );
}

function ToggleRow({ title, description, checked, onCheckedChange }: {
  title: string; description?: string; checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/* ---------- main view ---------- */

export function SettingsView() {
  const {
    autoplay, setAutoplay,
    monoAudio, setMonoAudio,
    eqEnabled, setEqEnabled,
    eqPreset, setEqPreset,
    eqBands, setEqBandGain,
    themeMode, setThemeMode,
    accentColor, setAccentColor,
    fontSize, setFontSize,
    streamingQuality, setStreamingQuality,
    crossfadeSeconds, setCrossfadeSeconds,
    normalizeVolume, setNormalizeVolume,
    keyboardShortcutsEnabled, setKeyboardShortcutsEnabled,
    language, setLanguage,
  } = useSettingsStore();

  const songs = useMusicStore((s) => s.songs);
  const { user, profile, displayName, signOut } = useAuth();
  const { toast } = useToast();

  const presets: EQPreset[] = ['flat', 'bass-boost', 'pop', 'rock', 'jazz', 'classical'];

  /* ---------- profile inline form ---------- */
  const [name, setName] = useState(displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(displayName); }, [displayName]);
  useEffect(() => { setAvatarUrl(profile?.avatar_url ?? null); }, [profile?.avatar_url]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Profil disimpan' });
    } catch {
      toast({ title: 'Gagal menyimpan profil', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      setAvatarUrl(url);
      toast({ title: 'Foto profil diupload' });
    } catch {
      toast({ title: 'Gagal upload foto', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ---------- storage info ---------- */
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);
  const [clearing, setClearing] = useState(false);

  const refreshStorage = async () => {
    if (!('storage' in navigator) || !navigator.storage.estimate) return;
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      setStorageUsed(usage);
      setStorageQuota(quota);
    } catch {/* ignore */}
  };
  useEffect(() => { refreshStorage(); }, [songs.length]);

  const usedMB = (storageUsed / 1024 / 1024).toFixed(0);
  const quotaMB = (storageQuota / 1024 / 1024).toFixed(0);
  const usagePct = storageQuota ? Math.min(100, (storageUsed / storageQuota) * 100) : 0;

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // Wipe local IndexedDB caches (audio + cover blobs). Cloud songs remain.
      const dbs = ['sybau-music-db'];
      await Promise.all(
        dbs.map(name => new Promise<void>((res) => {
          const req = indexedDB.deleteDatabase(name);
          req.onsuccess = req.onerror = req.onblocked = () => res();
        }))
      );
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      await refreshStorage();
      toast({ title: 'Cache dibersihkan' });
    } catch {
      toast({ title: 'Gagal membersihkan cache', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  /* ---------- keyboard shortcut table ---------- */
  const shortcuts = useMemo(() => ([
    { action: 'Play / Pause',    key: 'Space' },
    { action: 'Lagu berikutnya', key: '→' },
    { action: 'Lagu sebelumnya', key: '←' },
    { action: 'Volume naik',     key: '↑' },
    { action: 'Volume turun',    key: '↓' },
    { action: 'Shuffle',         key: 'S' },
    { action: 'Repeat',          key: 'R' },
    { action: 'Like lagu',       key: 'L' },
    { action: 'Mute',            key: 'M' },
  ]), []);

  /* ---------- counters ---------- */
  const lyricsCount = useMemo(() => songs.filter((s) => s.lyrics).length, [songs]);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings size={28} className="text-foreground" />
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pengaturan</h1>
      </div>

      {/* Kontrol Mendengarkan */}
      <Section title="Kontrol mendengarkan">
        <ToggleRow
          title="Autoplay"
          description="Konten yang mirip akan diputar saat apa yang kamu dengarkan berakhir."
          checked={autoplay}
          onCheckedChange={setAutoplay}
        />
        <div className="border-t border-border/40" />
        <ToggleRow
          title="Audio mono"
          description="Speaker kiri dan kanan memperdengarkan kualitas audio yang sama."
          checked={monoAudio}
          onCheckedChange={setMonoAudio}
        />
      </Section>

      {/* Equalizer */}
      <Section title="Equalizer" description="Sesuaikan frekuensi untuk meningkatkan pengalaman audiomu.">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold text-foreground">Aktifkan equalizer</span>
          <Switch checked={eqEnabled} onCheckedChange={setEqEnabled} />
        </div>

        {/* Smooth expand/collapse */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            eqEnabled ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          )}
        >
          {/* Preset chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setEqPreset(preset)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                  eqPreset === preset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {EQ_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>

          {/* EQ bands */}
          <div className="rounded-xl p-4 bg-white/5 border border-white/10">
            <div className="flex justify-between items-end gap-1 sm:gap-2">
              {eqBands.map((band, i) => (
                <div key={band.frequency} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                    {band.gain > 0 ? '+' : ''}{band.gain}
                  </span>
                  <div className="h-32 flex items-center justify-center">
                    <Slider
                      orientation="vertical"
                      min={-12}
                      max={12}
                      step={1}
                      value={[band.gain]}
                      onValueChange={([v]) => setEqBandGain(i, v)}
                      className="h-full"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{band.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Tampilan */}
      <Section title="Tampilan">
        {/* Tema */}
        <div className="py-3">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Tema</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'dark', label: 'Gelap', icon: Moon },
              { v: 'light', label: 'Terang', icon: Sun },
              { v: 'system', label: 'Ikut sistem', icon: Monitor },
            ] as { v: ThemeMode; label: string; icon: typeof Moon }[]).map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setThemeMode(v)}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border',
                  themeMode === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/5 border-white/10 text-foreground hover:bg-white/10'
                )}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Aksen */}
        <div className="py-3 border-t border-border/40">
          <h3 className="text-sm font-semibold text-foreground mb-2">Warna aksen</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((c) => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                aria-label={ACCENT_COLORS[c].label}
                title={ACCENT_COLORS[c].label}
                className={cn(
                  'w-9 h-9 rounded-full transition-all duration-150 ring-offset-2 ring-offset-background',
                  accentColor === c ? 'ring-2 ring-foreground scale-110' : 'hover:scale-105'
                )}
                style={{ backgroundColor: ACCENT_COLORS[c].swatch }}
              />
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="py-3 border-t border-border/40">
          <h3 className="text-sm font-semibold text-foreground mb-2">Ukuran font</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['small', 'medium', 'large'] as FontSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={cn(
                  'px-3 py-2 rounded-lg font-medium transition-all duration-150 border',
                  fontSize === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/5 border-white/10 text-foreground hover:bg-white/10',
                  s === 'small' && 'text-xs',
                  s === 'medium' && 'text-sm',
                  s === 'large' && 'text-base',
                )}
              >
                {s === 'small' ? 'Kecil' : s === 'medium' ? 'Sedang' : 'Besar'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Kualitas Audio */}
      <Section title="Kualitas audio">
        <div className="py-3">
          <div className="flex items-center gap-2 mb-2">
            <Headphones size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Kualitas streaming</h3>
          </div>
          <RadioGroup
            value={streamingQuality}
            onValueChange={(v) => setStreamingQuality(v as StreamingQuality)}
            className="gap-2"
          >
            {([
              { v: 'low',      title: 'Rendah',   sub: '96 kbps · Hemat data' },
              { v: 'normal',   title: 'Normal',   sub: '160 kbps · Direkomendasikan' },
              { v: 'high',     title: 'Tinggi',   sub: '320 kbps · Kualitas terbaik' },
              { v: 'lossless', title: 'Lossless', sub: 'FLAC · Ukuran file besar' },
            ] as { v: StreamingQuality; title: string; sub: string }[]).map(({ v, title, sub }) => (
              <Label
                key={v}
                htmlFor={`q-${v}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150',
                  streamingQuality === v
                    ? 'border-primary bg-primary/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
              >
                <RadioGroupItem value={v} id={`q-${v}`} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{title}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="py-3 border-t border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Crossfade antar lagu</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Transisi halus saat berpindah lagu.</p>
            </div>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {crossfadeSeconds === 0 ? '0 detik (Mati)' : `${crossfadeSeconds} detik`}
            </span>
          </div>
          <Slider
            min={0}
            max={12}
            step={1}
            value={[crossfadeSeconds]}
            onValueChange={([v]) => setCrossfadeSeconds(v)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0s</span><span>12s</span>
          </div>
        </div>

        <div className="border-t border-border/40">
          <ToggleRow
            title="Normalisasi volume"
            description="Samakan volume semua lagu."
            checked={normalizeVolume}
            onCheckedChange={setNormalizeVolume}
          />
        </div>
      </Section>

      {/* Pintasan keyboard */}
      <Section title="Pintasan keyboard">
        <div className="flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Aktifkan pintasan keyboard</span>
          </div>
          <Switch checked={keyboardShortcutsEnabled} onCheckedChange={setKeyboardShortcutsEnabled} />
        </div>
        <div
          className={cn(
            'rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-opacity',
            keyboardShortcutsEnabled ? 'opacity-100' : 'opacity-50'
          )}
        >
          {shortcuts.map((s, i) => (
            <div
              key={s.action}
              className={cn(
                'flex items-center justify-between px-4 py-2.5',
                i !== shortcuts.length - 1 && 'border-b border-white/5'
              )}
            >
              <span className="text-sm text-foreground">{s.action}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-background/60 border border-white/10 text-xs font-mono text-foreground min-w-[2rem] text-center">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </Section>

      {/* Bahasa */}
      <Section title="Bahasa">
        <div className="flex items-center gap-2 mb-2">
          <Languages size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Pilih bahasa antarmuka.</span>
        </div>
        <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
              <SelectItem key={l} value={l}>
                <span className="mr-2">{LANGUAGE_LABELS[l].flag}</span>
                {LANGUAGE_LABELS[l].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* Akun */}
      {user && (
        <Section title="Akun">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(210, 60%, 70%)' }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-black">
                      {(name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground flex items-center justify-center shadow-lg disabled:opacity-50"
                  aria-label="Ganti foto"
                >
                  {uploadingAvatar
                    ? <Loader2 size={12} className="text-background animate-spin" />
                    : <Pencil size={12} className="text-background" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1 mb-3">
              <Label htmlFor="username" className="text-xs text-muted-foreground">Username</Label>
              <Input
                id="username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Email */}
            <div className="space-y-1 mb-4">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="email"
                value={user.email ?? ''}
                disabled
                className="bg-white/5 border-white/10 opacity-60"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingProfile ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Simpan perubahan
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Keluar
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* Penyimpanan */}
      <Section title="Penyimpanan">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total lagu</p>
              <p className="text-lg font-bold text-foreground">{songs.length} lagu</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lyricsCount} dengan lirik
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ruang terpakai</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {usedMB} MB
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                dari {quotaMB} MB
              </p>
            </div>
          </div>

          <div>
            <Progress value={usagePct} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
              {usagePct.toFixed(1)}% terpakai
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <HardDrive size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cache lokal lagu & cover</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClearCache}
              disabled={clearing}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              {clearing ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Bersihkan cache
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Hapus semua lagu
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus semua lagu?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus seluruh lagu dari cloud dan tidak bisa dibatalkan.
                    Hubungi admin untuk konfirmasi penghapusan massal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      toast({
                        title: 'Fitur dibatasi',
                        description: 'Hubungi admin untuk menghapus semua lagu.',
                      })
                    }
                  >
                    Lanjutkan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Section>

      {/* Tentang */}
      <Section title="Tentang">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Versi</span>
            <span className="text-sm text-foreground">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Audio Engine</span>
            <span className="text-sm text-foreground">Web Audio API</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <UserIcon size={14} /> Login sebagai
            </span>
            <span className="text-sm text-foreground truncate max-w-[60%]">
              {user?.email ?? 'Tamu'}
            </span>
          </div>
        </div>
      </Section>
    </div>
  );
}
