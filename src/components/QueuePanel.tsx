import { X, GripVertical, Trash2, ListMusic, Music2 } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { Song } from '@/types/music';
import { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function QueuePanel() {
  const {
    userQueue,
    removeFromUserQueue,
    clearUserQueue,
    reorderUserQueue,
    showQueuePanel,
    setShowQueuePanel,
    playerState,
    queue,
    queueIndex,
    playSong,
    songs,
  } = useMusicStore();
  const timeTheme = useTimeTheme();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const { currentSong } = playerState;
  const availableQueue = queue.length > 0 ? queue : songs;
  const upNext = availableQueue.slice(queueIndex + 1, queueIndex + 11);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      reorderUserQueue(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Sheet open={showQueuePanel} onOpenChange={setShowQueuePanel}>
      <SheetContent side="right" className="w-full sm:w-[400px] bg-background border-border p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <ListMusic size={20} /> Queue
            </SheetTitle>
            {userQueue.length > 0 && (
              <button
                onClick={clearUserQueue}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
              >
                Clear queue
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Now Playing */}
          {currentSong && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Now Playing</p>
              <QueueItem song={currentSong} isActive timeTheme={timeTheme} />
            </div>
          )}

          {/* User Queue */}
          {userQueue.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Next in Queue ({userQueue.length})
              </p>
              <div className="space-y-1">
                {userQueue.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "transition-all",
                      dragIndex === index && "opacity-50",
                      dragOverIndex === index && "border-t-2 border-primary"
                    )}
                  >
                    <QueueItem
                      song={song}
                      timeTheme={timeTheme}
                      onRemove={() => removeFromUserQueue(index)}
                      showDragHandle
                      onClick={() => {
                        // Play the song from user queue & remove it
                        removeFromUserQueue(index);
                        playSong(song);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto Queue (Up Next) */}
          {upNext.length > 0 && (
            <div className="px-4 pt-4 pb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Next Up
              </p>
              <div className="space-y-1">
                {upNext.map((song, index) => (
                  <QueueItem
                    key={`auto-${song.id}-${index}`}
                    song={song}
                    timeTheme={timeTheme}
                    onClick={() => playSong(song, availableQueue)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!currentSong && userQueue.length === 0 && upNext.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Music2 size={48} className="mb-4 opacity-50" />
              <p className="text-sm">Queue is empty</p>
              <p className="text-xs mt-1">Add songs to your queue to play them next</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface QueueItemProps {
  song: Song;
  isActive?: boolean;
  timeTheme: ReturnType<typeof useTimeTheme>;
  onRemove?: () => void;
  showDragHandle?: boolean;
  onClick?: () => void;
}

function QueueItem({ song, isActive, timeTheme, onRemove, showDragHandle, onClick }: QueueItemProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors group",
        isActive ? "bg-accent/50" : "hover:bg-accent cursor-pointer"
      )}
      onClick={onClick}
    >
      {showDragHandle && (
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical size={16} />
        </div>
      )}
      <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isActive && timeTheme.accentColor)}>
          {song.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
