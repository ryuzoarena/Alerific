import { X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SettingsView } from './views/SettingsView';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dark overlay */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!isOpen}
      />

      {/* Slide-in drawer from left */}
      <aside
        role="dialog"
        aria-label="Pengaturan"
        className={cn(
          'fixed top-0 left-0 h-full w-[min(420px,92vw)] z-[100] bg-card border-r border-border shadow-2xl',
          'transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-foreground">Pengaturan</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <SettingsView />
        </div>
      </aside>
    </>
  );
}
