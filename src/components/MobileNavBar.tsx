import { Home, Search, Library, Sparkles, Plus, Trash2, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';
import { useTimeTheme } from '@/hooks/useTimeTheme';

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
  const [isSpinning, setIsSpinning] = useState(false);
  const timeTheme = useTimeTheme();

  const handleFeaturedClick = () => {
    setIsSpinning(true);
    setIsOpen(!isOpen);
    setTimeout(() => setIsSpinning(false), 500);
  };
  
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
            <button 
              className="flex flex-col items-center gap-1 px-4 py-2"
              onClick={handleFeaturedClick}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center theme-transition transition-transform duration-500",
                isDeleteMode ? "bg-destructive" : timeTheme.accentBg,
                isSpinning && "animate-spin"
              )}>
                <Sparkles size={14} className={`theme-transition ${timeTheme.buttonText}`} />
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
            className="w-72 p-3 bg-card/95 backdrop-blur-xl border-border rounded-2xl" 
            side="top" 
            align="end"
            sideOffset={12}
          >
            <div className="flex flex-col gap-2">
              {/* Add Song Option */}
              <button
                onClick={handleAddSong}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-accent/50 transition-colors text-left"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center theme-transition",
                  timeTheme.accentBg + "/20"
                )}>
                  <Music size={22} className={`theme-transition ${timeTheme.accentColor}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Add Song</span>
                  <span className="text-xs text-muted-foreground">Upload music to your library</span>
                </div>
              </button>
              
              {/* Delete Song Option */}
              <button
                onClick={handleDeleteMode}
                className={cn(
                  "flex items-center gap-4 p-2 rounded-xl hover:bg-accent/50 transition-colors text-left",
                  isDeleteMode && "bg-destructive/10"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isDeleteMode ? "bg-destructive/20" : "bg-muted"
                )}>
                  <Trash2 size={22} className={cn(
                    isDeleteMode ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-semibold",
                    isDeleteMode ? "text-destructive" : "text-foreground"
                  )}>
                    {isDeleteMode ? "Exit Delete Mode" : "Delete Song"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isDeleteMode ? "Return to normal view" : "Remove songs from library"}
                  </span>
                </div>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
