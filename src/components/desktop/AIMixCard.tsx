import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MusicCategory } from './musicCategories';

export function AIMixCard({ title, description, Icon, hue, onClick }: MusicCategory & { onClick?: () => void }) {
  return (
    <Button variant="plain" size="plain"
      onClick={onClick}
      aria-label={`Play ${title}`}
      className={`mix-category mix-${hue} group relative shrink-0 w-[150px] md:w-[180px] h-[210px] md:h-[220px] rounded-lg overflow-hidden text-left whitespace-normal transition-transform motion-safe:hover:-translate-y-1`}
    >
      <Icon className="mix-icon absolute left-4 top-5 !w-12 !h-12" strokeWidth={1.4} />
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-14">
        <h3 className="text-foreground font-bold text-sm md:text-base leading-tight mb-1">{title}</h3>
        <p className="text-foreground/70 text-xs line-clamp-2">{description}</p>
      </div>
      <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        <Play size={18} className="ml-0.5" fill="currentColor" />
      </div>
    </Button>
  );
}
