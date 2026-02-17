import { 
  Zap, Clock, Megaphone, Settings, Trash2, Music, 
  MessageSquarePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userName?: string;
  onUploadClick: () => void;
  onDeleteModeToggle?: () => void;
  isDeleteMode?: boolean;
  onViewChange: (view: any) => void;
  onGetStarted?: () => void;
}

export function ProfileDrawer({
  isOpen,
  onClose,
  isLoggedIn,
  userName = 'User',
  onUploadClick,
  onDeleteModeToggle,
  isDeleteMode,
  onViewChange,
  onGetStarted,
}: ProfileDrawerProps) {
  const timeTheme = useTimeTheme();
  const initial = userName.charAt(0).toUpperCase();

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-card z-[70] transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'hsl(25, 40%, 40%)' }}>
                <span className="text-foreground text-xl font-bold">{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{userName}</p>
                <p className="text-sm text-muted-foreground">Lihat profil</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleAction(() => onGetStarted?.())}
              className={cn(
                "w-full py-3 rounded-full text-sm font-bold transition-transform hover:scale-[1.02]",
                timeTheme.accentBg, timeTheme.buttonText
              )}
            >
              Get Started
            </button>
          )}
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoggedIn && (
            <>
              {/* Add Song */}
              <button
                onClick={() => handleAction(onUploadClick)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
              >
                <Music size={24} className="text-foreground" />
                <span className="text-base text-foreground">Tambah Lagu</span>
              </button>

              {/* Delete Song */}
              <button
                onClick={() => handleAction(() => onDeleteModeToggle?.())}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
              >
                <Trash2 size={24} className={cn(isDeleteMode ? "text-destructive" : "text-foreground")} />
                <span className={cn("text-base", isDeleteMode ? "text-destructive" : "text-foreground")}>
                  {isDeleteMode ? "Matikan Mode Hapus" : "Hapus Lagu"}
                </span>
              </button>
            </>
          )}

          {/* Yang baru */}
          <button
            onClick={() => handleAction(() => {})}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
          >
            <Zap size={24} className="text-foreground" />
            <span className="text-base text-foreground">Yang baru</span>
          </button>

          {/* Baru Diputar */}
          <button
            onClick={() => handleAction(() => {})}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
          >
            <Clock size={24} className="text-foreground" />
            <span className="text-base text-foreground">Baru Diputar</span>
          </button>

          {/* Info Terkini */}
          <button
            onClick={() => handleAction(() => {})}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
          >
            <Megaphone size={24} className="text-foreground" />
            <span className="text-base text-foreground">Info Terkini</span>
          </button>

          {/* Pengaturan dan privasi */}
          <button
            onClick={() => handleAction(() => onViewChange('settings'))}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
          >
            <Settings size={24} className="text-foreground" />
            <span className="text-base text-foreground">Pengaturan dan privasi</span>
          </button>

          {/* Pesan section */}
          <div className="mt-4 px-5 pt-4 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-1">Pesan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bagikan konten favoritmu ke teman
            </p>
            <button className="flex items-center gap-3 py-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <MessageSquarePlus size={22} className="text-muted-foreground" />
              </div>
              <span className="text-base text-foreground font-medium">Pesan baru</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
