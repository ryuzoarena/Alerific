import { Home, Search, Library, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  onCreatePlaylistClick?: () => void;
}

export function MobileNavBar({ activeView, onViewChange, onCreatePlaylistClick }: MobileNavBarProps) {
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home', action: () => onViewChange('home') },
    { id: 'search' as const, icon: Search, label: 'Cari', action: () => onViewChange('search') },
    { id: 'library' as const, icon: Library, label: 'Koleksi Kamu', action: () => onViewChange('library') },
    { id: 'create' as const, icon: Plus, label: 'Buat', action: () => onCreatePlaylistClick?.() },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]">
      <div className="flex items-center justify-around py-2 pb-3">
        {navItems.map((item) => {
          const isActive = item.id !== 'create' && activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0"
            >
              <item.icon
                size={26}
                className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "text-white/50"
                )}
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium truncate",
                isActive ? "text-white" : "text-white/50"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
