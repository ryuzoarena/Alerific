import { Settings, ChevronRight, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore, EQ_PRESET_LABELS, EQPreset } from '@/stores/settingsStore';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { cn } from '@/lib/utils';

interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function SettingToggle({ title, description, checked, onCheckedChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsView() {
  const {
    autoplay, setAutoplay,
    monoAudio, setMonoAudio,
    pictureInPicture, setPictureInPicture,
    eqEnabled, setEqEnabled,
    eqPreset, setEqPreset,
    eqBands, setEqBandGain,
  } = useSettingsStore();
  const timeTheme = useTimeTheme();

  const presets: EQPreset[] = ['flat', 'bass-boost', 'treble-boost', 'vocal', 'rock', 'pop', 'jazz'];

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings size={28} className="text-foreground" />
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Kontrol Mendengarkan */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-2">Kontrol mendengarkan</h2>
        <div className="divide-y divide-border">
          <SettingToggle
            title="Autoplay"
            description="Konten yang mirip akan diputar saat apa yang kamu dengarkan berakhir."
            checked={autoplay}
            onCheckedChange={setAutoplay}
          />
          <SettingToggle
            title="Audio mono"
            description="Speaker kiri dan kanan memperdengarkan kualitas audio yang sama."
            checked={monoAudio}
            onCheckedChange={setMonoAudio}
          />
        </div>
      </section>

      {/* Kontrol Video */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-2">Kontrol video</h2>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-4">
            <div className="flex-1 pr-4">
              <h3 className="text-base font-semibold text-foreground">Picture in picture</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kecilkan video di pemutar mini saat kamu menutup app, agar kamu bisa terus menonton sambil memakai app.
              </p>
            </div>
            <Switch checked={pictureInPicture} onCheckedChange={setPictureInPicture} />
          </div>
        </div>
        <div className="flex items-start gap-2 mt-3 px-1">
          <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Di pengaturan Android, buka Apps (Aplikasi) &gt; Special app access (Akses aplikasi khusus) &gt; Picture-in-picture (Gambar dalam gambar) untuk mengizinkan picture in picture.
          </p>
        </div>
      </section>

      {/* Equalizer */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Equalizer</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sesuaikan frekuensi yang berbeda untuk meningkatkan pengalaman audiomu.
            </p>
          </div>
          <Switch checked={eqEnabled} onCheckedChange={setEqEnabled} />
        </div>

        {eqEnabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setEqPreset(preset)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    eqPreset === preset
                      ? `theme-transition ${timeTheme.accentBg} ${timeTheme.buttonText}`
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {EQ_PRESET_LABELS[preset]}
                </button>
              ))}
            </div>

            {/* EQ Sliders */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex justify-between items-end gap-2">
                {eqBands.map((band, i) => (
                  <div key={band.frequency} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      {band.gain > 0 ? '+' : ''}{band.gain}dB
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
                    <span className="text-xs text-muted-foreground">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Info section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-2">Tentang</h2>
        <div className="bg-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Versi</span>
            <span className="text-sm text-foreground">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Audio Engine</span>
            <span className="text-sm text-foreground">Web Audio API</span>
          </div>
        </div>
      </section>
    </div>
  );
}
