import { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
}

export function AddSongsToPlaylistDialog({ isOpen, onClose, playlistId }: Props) {
  const { songs, playlists, addSongsToPlaylist } = useMusicStore();
  const playlist = playlists.find((p) => p.id === playlistId);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const existing = useMemo(() => new Set(playlist?.songIds || []), [playlist]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album?.toLowerCase().includes(q),
    );
  }, [songs, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0 || !playlistId) return;
    setSubmitting(true);
    await addSongsToPlaylist(playlistId, Array.from(selected));
    setSubmitting(false);
    setSelected(new Set());
    setQuery('');
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelected(new Set());
      setQuery('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-[#181818] border-white/10 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-white">
            Add songs to {playlist ? `"${playlist.name}"` : 'playlist'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library..."
              className="w-full h-10 pl-9 pr-3 text-sm rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-2 pb-2 scrollbar-hide">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-white/50 py-8">No songs found</p>
          ) : (
            filtered.map((song) => {
              const inPlaylist = existing.has(song.id);
              const isChecked = inPlaylist || selected.has(song.id);
              return (
                <button
                  key={song.id}
                  type="button"
                  disabled={inPlaylist}
                  onClick={() => !inPlaylist && toggle(song.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                    inPlaylist ? 'opacity-40 cursor-default' : 'hover:bg-white/[0.06]',
                  )}
                >
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/5">
                    {song.coverUrl && <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-white/50 truncate">{song.artist}</p>
                  </div>
                  {inPlaylist ? (
                    <Check size={16} className="text-primary" />
                  ) : (
                    <Checkbox checked={isChecked} className="h-4 w-4" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-full"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selected.size === 0 || submitting}
            className="px-5 py-2 text-sm font-semibold rounded-full bg-primary text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
          >
            {submitting ? 'Adding…' : `Add ${selected.size || ''} ${selected.size === 1 ? 'song' : 'songs'}`.trim()}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
