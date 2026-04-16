import { ChevronLeft, ChevronRight, Bell, Users } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { cn } from '@/lib/utils';

interface DesktopTopNavProps {
  onBack?: () => void;
  onForward?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  onAvatarClick?: () => void;
  onGetStarted?: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'podcasts', label: 'Podcasts' },
];

export function DesktopTopNav({
  onBack,
  onForward,
  isLoggedIn,
  userName,
  onAvatarClick,
  onGetStarted,
  activeFilter,
  onFilterChange,
}: DesktopTopNavProps) {
  return (
    <div className="sticky top-0 z-20 bg-[#121212]/80 backdrop-blur-xl">
      {/* Top row */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: nav arrows + filter chips */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onForward}
            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          <div className="flex gap-2 ml-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
                  activeFilter === f.id
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: icons + avatar */}
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <Bell size={18} />
          </button>
          <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <Users size={18} />
          </button>

          {isLoggedIn ? (
            <button
              onClick={onAvatarClick}
              className="w-8 h-8 rounded-full bg-[#535353] flex items-center justify-center hover:scale-105 transition-transform"
            >
              <span className="text-white text-xs font-bold">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
          ) : (
            <button
              onClick={onGetStarted}
              className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
            >
              Sign up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
