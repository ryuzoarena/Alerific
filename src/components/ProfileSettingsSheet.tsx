import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface ProfileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsSheet({ isOpen, onClose }: ProfileSettingsSheetProps) {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showRecentArtists, setShowRecentArtists] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[80] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[90] bg-card rounded-t-2xl transition-transform duration-300 ease-out max-h-[70vh] overflow-y-auto",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
        </div>

        {/* Title */}
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground text-center">
            Yang bisa dilihat orang lain
          </h2>
        </div>

        {/* Toggle items */}
        <div className="px-5 py-2">
          {/* Pengikut dan mengikuti */}
          <div className="flex items-start gap-4 py-5 border-b border-border/50">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Pengikut dan mengikuti</p>
              <p className="text-xs text-muted-foreground mt-1">
                Di profilmu, orang bisa melihat siapa yang mengikutimu dan siapa yang kamu ikuti.
              </p>
            </div>
            <Switch checked={showFollowers} onCheckedChange={setShowFollowers} />
          </div>

          {/* Playlist */}
          <div className="flex items-start gap-4 py-5 border-b border-border/50">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Playlist</p>
              <p className="text-xs text-muted-foreground mt-1">
                Orang bisa melihat playlist yang kamu tambahkan ke profilmu.
              </p>
            </div>
            <Switch checked={showPlaylists} onCheckedChange={setShowPlaylists} />
          </div>

          {/* Artis yang baru diputar */}
          <div className="flex items-start gap-4 py-5 border-b border-border/50">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Artis yang baru diputar</p>
              <p className="text-xs text-muted-foreground mt-1">
                Orang bisa melihat siapa yang baru-baru ini kamu dengarkan di profilmu.
              </p>
            </div>
            <Switch checked={showRecentArtists} onCheckedChange={setShowRecentArtists} />
          </div>

          {/* Link to all settings */}
          <button className="w-full py-5 text-left">
            <span className="text-sm font-semibold text-foreground">
              Lihat semua pengaturan privasi dan sosial
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
