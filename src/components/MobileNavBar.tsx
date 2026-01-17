import { Home, Search, Library, Sparkles, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

interface MobileNavBarProps {
  activeView: 'home' | 'search' | 'library' | 'playlist';
  onViewChange: (view: 'home' | 'search' | 'library' | 'playlist') => void;
  onUploadClick: () => void;
  onDeleteModeToggle?: () => void;
  isDeleteMode?: boolean;
}

export function MobileNavBar({ 
  activeView, 
  onViewChange, 
  onUploadClick, 
  onDeleteModeToggle,
  isDeleteMode 
}: MobileNavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'library' as const, icon: Library, label: 'Library' },
  ];

  const handleAddSong = () => {
    setIsOpen(false);
    onUploadClick();
  };

  const handleDeleteMode = () => {
    setIsOpen(false);
    onDeleteModeToggle?.();
  };

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
        
        {/* Featured button with menu */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-4 py-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                isDeleteMode ? "bg-destructive" : "bg-primary"
              )}>
                <Sparkles size={14} className="text-primary-foreground" />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isDeleteMode ? "text-destructive" : "text-muted-foreground"
              )}>
                Featured
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-2 bg-card border-border" 
            side="top" 
            align="end"
            sideOffset={12}
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={handleAddSong}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Plus size={18} className="text-primary" />
                <span className="text-sm font-medium">Add Song</span>
              </button>
              <button
                onClick={handleDeleteMode}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left",
                  isDeleteMode && "bg-destructive/10"
                )}
              >
                <Trash2 size={18} className={cn(
                  isDeleteMode ? "text-destructive" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isDeleteMode && "text-destructive"
                )}>
                  {isDeleteMode ? "Exit Delete Mode" : "Delete Song"}
                </span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
