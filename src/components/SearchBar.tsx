import { Search } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useMusicStore();

  return (
    <div className="relative max-w-md">
      <Search 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
      />
      <input
        type="text"
        placeholder="What do you want to listen to?"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-10 pl-10 pr-4 bg-card border-none rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
