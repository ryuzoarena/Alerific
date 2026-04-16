import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMixCardProps {
  title: string;
  description: string;
  gradient: string;
  onClick?: () => void;
}

export function AIMixCard({ title, description, gradient, onClick }: AIMixCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex-shrink-0 w-[180px] h-[220px] rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
        "hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
        // Glassmorphism on hover
        "before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        "before:bg-white/5 before:backdrop-blur-sm"
      )}
    >
      <div className={cn("absolute inset-0", gradient)} />
      <div className="relative z-10 flex flex-col justify-end h-full p-4">
        <h3 className="text-white font-bold text-base leading-tight mb-1">{title}</h3>
        <p className="text-white/70 text-xs line-clamp-2">{description}</p>
      </div>
      {/* Play button on hover */}
      <div className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
        <Play size={18} className="text-black ml-0.5" fill="currentColor" />
      </div>
    </button>
  );
}
