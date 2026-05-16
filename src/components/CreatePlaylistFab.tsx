import { Plus } from 'lucide-react';

interface Props {
  onClick: () => void;
}

/** Mobile/tablet floating action button to create a new playlist. */
export function CreatePlaylistFab({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create playlist"
      className="lg:hidden fixed right-5 z-40 w-14 h-14 rounded-full bg-primary flex items-center justify-center text-black shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-transform duration-200 hover:scale-110 active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 156px)' }}
    >
      <Plus size={24} strokeWidth={2.8} />
    </button>
  );
}
