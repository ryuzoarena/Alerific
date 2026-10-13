import { Home, Search, Library, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <nav className="mobile-bottom-nav min-[1100px]:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = item.id !== 'create' && activeView === item.id;
          return (
            <Button variant="plain" size="plain"
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 min-h-11 flex-1"
            >
              <item.icon
                size={26}
                className={cn(
                  "transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium truncate",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
