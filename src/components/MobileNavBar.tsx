import { Home, Search, Library, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
  activeView: 'home' | 'search' | 'library' | 'playlist';
  onViewChange: (view: 'home' | 'search' | 'library' | 'playlist') => void;
  onUploadClick: () => void;
}

export function MobileNavBar({ activeView, onViewChange, onUploadClick }: MobileNavBarProps) {
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'library' as const, icon: Library, label: 'Library' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-4 pb-2 px-2 z-50">
      <div className="flex items-center justify-around bg-black/50 backdrop-blur-lg rounded-2xl py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <item.icon 
              size={24} 
              className={cn(
                "transition-colors",
                activeView === item.id ? "text-white" : "text-muted-foreground"
              )}
              fill={activeView === item.id ? "currentColor" : "none"}
            />
            <span className={cn(
              "text-[10px] font-medium",
              activeView === item.id ? "text-white" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </button>
        ))}
        
        {/* Upload button in nav */}
        <button
          onClick={onUploadClick}
          className="flex flex-col items-center gap-1 px-4 py-2"
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Plus size={16} className="text-primary-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            Add
          </span>
        </button>
      </div>
    </nav>
  );
}
