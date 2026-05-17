import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Shuffle,
  MoreHorizontal,
  Music2,
  ChevronLeft,
  Globe,
  Lock,
  Camera,
  Heart,
  Plus,
  Trash2,
  Share2,
  Download,
  Pencil,
  X,
  ListPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMusicStore } from '@/stores/musicStore';
import { useAuth } from '@/hooks/useAuth';
import { useDominantPalette } from '@/hooks/useDominantColor';
import { PlaylistCoverArt } from '@/components/PlaylistCoverArt';
import { AddSongsToPlaylistDialog } from '@/components/AddSongsToPlaylistDialog';
import { compressImage } from '@/lib/imageCompress';
import type { Song } from '@/types/music';

interface Props {
  playlistId: string;
  onBack?: () => void;
}

function formatTotalDuration(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatRowDuration(dur: number) {
  if (!dur || !isFinite(dur)) return '0:00';
  const m = Math.floor(dur / 60);
  const s = Math.floor(dur % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MobilePlaylistView({ playlistId, onBack }: Props) {
  const {
    playlists,
    songs,
    playSong,
    playerState,
    togglePlay,
    toggleShuffle,
    deletePlaylist,
    setPlaylistVisibility,
    updatePlaylistCover,
    removeSongFromPlaylist,
    savePlaylistToLibrary,
    unsavePlaylistFromLibrary,
  } = useMusicStore();
  const { user } = useAuth();
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const playlist = playlists.find((p) => p.id === playlistId);
  const playlistSongs = useMemo(
    () =>
      (playlist?.songIds || [])
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean) as Song[],
    [playlist?.songIds, songs],
  );

  const palette = useDominantPalette(playlist?.coverUrl || playlistSongs[0]?.coverUrl || null);
  const accent = palette.accent;
  const accentRgb = palette.rgb;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!playlist) {
    return (
      <div className="h-full flex items-center justify-center text-white/60">
        Playlist not found
      </div>
    );
  }

  const isLiked = playlist.id === 'liked';
  const isOwner = isLiked || (!!user && playlist.owner_id === user.id);
  const isSavedByMe = !!playlist.isSaved;

  const totalDuration = playlistSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const isCurrentlyPlayingHere =
    playerState.isPlaying &&
    playerState.currentSong &&
    playlistSongs.some((s) => s.id === playerState.currentSong!.id);

  const handlePlay = () => {
    if (playlistSongs.length === 0) return;
    if (isCurrentlyPlayingHere) {
      togglePlay();
    } else {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  const handleShuffle = () => {
    if (playlistSongs.length === 0) return;
    if (!playerState.shuffle) toggleShuffle();
    const idx = Math.floor(Math.random() * playlistSongs.length);
    playSong(playlistSongs[idx], playlistSongs);
  };

  const handleToggleVisibility = async () => {
    if (!isOwner || isLiked) return;
    await setPlaylistVisibility(playlist.id, !playlist.is_public);
    toast.success(playlist.is_public ? 'Playlist set to Private' : 'Playlist is now Public');
    setShowMoreSheet(false);
  };

  const handleDeletePlaylist = async () => {
    if (!confirm(`Delete playlist "${playlist.name}"?`)) return;
    await deletePlaylist(playlist.id);
    setShowMoreSheet(false);
    onBack?.();
  };

  const handleSaveToggle = async () => {
    if (isSavedByMe) {
      await unsavePlaylistFromLibrary(playlist.id);
      toast.success('Removed from your library');
    } else {
      await savePlaylistToLibrary(playlist.id);
      toast.success('Saved to your library');
    }
  };

  const handleCoverFile = async (file: File | null) => {
    if (!file || !isOwner || isLiked) return;
    try {
      const blob = await compressImage(file);
      await updatePlaylistCover(playlist.id, blob);
      toast.success('Cover updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update cover');
    }
    setShowMoreSheet(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: playlist.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link disalin');
      }
    } catch {/* ignore */}
    setShowMoreSheet(false);
  };

  const stickyOpacity = Math.min(1, Math.max(0, (scrollY - 220) / 80));
  const coverScale = Math.max(0.6, 1 - scrollY / 600);
  const coverOpacity = Math.max(0, 1 - scrollY / 220);
  const bgUrl = playlist.coverUrl || playlistSongs[0]?.coverUrl;

  return (
    <div
      ref={scrollerRef}
      className="h-full overflow-y-auto pb-32 relative"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        background: `linear-gradient(180deg, rgba(${accentRgb},0.18) 0%, #0a0a0a 60%)`,
      }}
    >
      {/* Sticky mini header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 h-14 pointer-events-none"
        style={{
          opacity: stickyOpacity,
          background: 'rgba(18,18,18,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transition: 'opacity 0.15s ease',
        }}
      >
        <button
          onClick={onBack}
          className="pointer-events-auto w-9 h-9 -ml-2 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft size={26} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-auto">
          <PlaylistCoverArt playlist={playlist} songs={playlistSongs} size={32} rounded="rounded-md" />
          <span className="text-white font-semibold text-sm truncate">{playlist.name}</span>
        </div>
        <button
          onClick={handlePlay}
          className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: accent, boxShadow: `0 4px 16px rgba(${accentRgb},0.5)` }}
          aria-label="Play"
        >
          <Play size={16} className="ml-0.5" fill="#000" color="#000" />
        </button>
      </div>

      {/* Hero header */}
      <div className="relative">
        {/* Full-bleed blurred background */}
        {bgUrl && (
          <div className="absolute inset-0 -z-0 overflow-hidden" aria-hidden>
            <img
              src={bgUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{
                filter: 'blur(40px) brightness(0.4) saturate(1.4)',
                transform: 'scale(1.4)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,10,10,0.5) 60%, #0a0a0a 100%)',
              }}
            />
          </div>
        )}

        <div className="relative z-10 pt-16 pb-6 px-5 flex flex-col items-center text-center">
          {/* Cover */}
          <div
            className="relative group"
            style={{
              transform: `scale(${coverScale})`,
              opacity: coverOpacity,
              transformOrigin: 'center top',
              transition: 'opacity 0.2s ease',
              willChange: 'transform, opacity',
            }}
          >
            <div
              style={{
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}
            >
              <PlaylistCoverArt
                playlist={playlist}
                songs={playlistSongs}
                size={160}
                rounded="rounded-none"
              />
            </div>
            {isOwner && !isLiked && (
              <>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold bg-black/0 active:bg-black/40 rounded-2xl transition-colors"
                  aria-label="Change cover"
                >
                  <Camera size={22} className="opacity-0 active:opacity-100" />
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCoverFile(e.target.files?.[0] || null)}
                />
              </>
            )}
          </div>

          {/* Visibility pill */}
          {!isLiked && (
            <span
              className={cn(
                'mt-5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full',
              )}
              style={
                playlist.is_public
                  ? {
                      border: '1px solid rgba(34,197,94,0.5)',
                      color: 'rgb(134,239,172)',
                      background: 'rgba(34,197,94,0.1)',
                    }
                  : {
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.7)',
                    }
              }
            >
              {playlist.is_public ? <Globe size={10} /> : <Lock size={10} />}
              {playlist.is_public ? 'Public' : 'Private'}
            </span>
          )}

          {/* Title */}
          <h1
            className="mt-2 text-white font-extrabold leading-tight"
            style={{ fontSize: 36, letterSpacing: '-0.02em' }}
          >
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="mt-1 text-white/70 text-sm max-w-[280px] truncate">
              {playlist.description}
            </p>
          )}

          <p className="mt-2 text-white/60 text-[13px]">
            {playlist.owner_username && !isLiked && (
              <>
                <span className="text-white font-medium">{playlist.owner_username}</span>
                <span className="mx-1.5">•</span>
              </>
            )}
            {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
            {totalDuration > 0 && (
              <>
                <span className="mx-1.5">•</span>
                {formatTotalDuration(totalDuration)}
              </>
            )}
          </p>

          {/* Action row */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handlePlay}
              disabled={playlistSongs.length === 0}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              style={{
                background: accent,
                boxShadow: `0 8px 24px rgba(${accentRgb},0.55)`,
              }}
              aria-label="Play"
            >
              {isCurrentlyPlayingHere ? (
                <span className="flex gap-1">
                  <span className="w-1 h-4 bg-black rounded-full" />
                  <span className="w-1 h-4 bg-black rounded-full" />
                </span>
              ) : (
                <Play size={24} className="ml-0.5" fill="#000" color="#000" />
              )}
            </button>

            <button
              onClick={handleShuffle}
              disabled={playlistSongs.length === 0}
              className="inline-flex items-center gap-1.5 px-4 h-11 rounded-full text-sm font-medium text-white/90 active:scale-95 transition-transform disabled:opacity-50"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Shuffle size={16} /> Acak
            </button>

            {!isOwner && user && (
              <button
                onClick={handleSaveToggle}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: isSavedByMe ? accent : 'white',
                }}
                aria-label={isSavedByMe ? 'Unsave' : 'Save'}
              >
                <Heart size={18} fill={isSavedByMe ? 'currentColor' : 'none'} />
              </button>
            )}

            <button
              onClick={() => setShowMoreSheet(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
              aria-label="More"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="relative z-10 px-3 pt-2">
        {playlistSongs.length === 0 ? (
          <EmptyState
            isOwner={isOwner && !isLiked}
            accent={accent}
            onAdd={() => setShowAddSongs(true)}
          />
        ) : (
          <ul className="flex flex-col">
            {playlistSongs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                queue={playlistSongs}
                accent={accent}
                accentRgb={accentRgb}
                isOwner={isOwner && !isLiked}
                playlistId={playlist.id}
                onRemove={async () => {
                  await removeSongFromPlaylist(playlist.id, song.id);
                  toast.success(`"${song.title}" dihapus`);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <AddSongsToPlaylistDialog
        isOpen={showAddSongs}
        onClose={() => setShowAddSongs(false)}
        playlistId={playlist.id}
      />

      {showMoreSheet && (
        <MoreBottomSheet
          onClose={() => setShowMoreSheet(false)}
          isOwner={isOwner && !isLiked}
          isPublic={!!playlist.is_public}
          onEditCover={() => {
            setShowMoreSheet(false);
            coverInputRef.current?.click();
          }}
          onToggleVisibility={handleToggleVisibility}
          onAddSongs={() => {
            setShowMoreSheet(false);
            setShowAddSongs(true);
          }}
          onShare={handleShare}
          onDelete={handleDeletePlaylist}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────── empty state
function EmptyState({
  isOwner,
  accent,
  onAdd,
}: {
  isOwner: boolean;
  accent: string;
  onAdd: () => void;
}) {
  return (
    <div className="text-center py-20 px-6">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'rgba(255,255,255,0.06)',
          animation: 'mpv-bounce 2s ease-in-out infinite',
        }}
      >
        <Music2 size={36} className="text-white/70" />
      </div>
      <h2 className="text-white text-lg font-bold mb-1">Playlist ini masih kosong</h2>
      <p className="text-white/60 text-sm mb-5">Tambahkan lagu dari koleksimu</p>
      {isOwner && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full font-semibold text-sm text-black active:scale-95 transition-transform"
          style={{ background: accent, boxShadow: `0 8px 24px ${accent}55` }}
        >
          <Plus size={16} /> Tambah Lagu
        </button>
      )}
      <style>{`@keyframes mpv-bounce {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }`}</style>
    </div>
  );
}

// ───────────────────────────────────────────────────────── song row
function SongRow({
  song,
  index,
  queue,
  accent,
  accentRgb,
  isOwner,
  playlistId,
  onRemove,
}: {
  song: Song;
  index: number;
  queue: Song[];
  accent: string;
  accentRgb: string;
  isOwner: boolean;
  playlistId: string;
  onRemove: () => void | Promise<void>;
}) {
  const { playSong, playerState, addToUserQueue } = useMusicStore();
  const isActive = playerState.currentSong?.id === song.id;
  const isPlaying = isActive && playerState.isPlaying;
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePlay = () => playSong(song, queue);
  const showDivider = (index + 1) % 5 === 0 && index !== queue.length - 1;

  return (
    <li>
      <div
        onClick={handlePlay}
        className="flex items-center gap-3 pr-1 pl-3 active:scale-[0.99] transition-transform cursor-pointer rounded-lg"
        style={{
          height: 68,
          borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
          background: isActive ? `rgba(${accentRgb}, 0.10)` : 'transparent',
          paddingLeft: isActive ? 9 : 12,
        }}
      >
        {/* Art / equalizer */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          )}
          {isPlaying && (
            <div
              className="absolute inset-0 flex items-end justify-center gap-[2px] pb-1 bg-black/45"
              aria-hidden
            >
              <span
                className="w-[3px] rounded-sm"
                style={{ background: accent, animation: 'mpv-eq 0.9s ease-in-out infinite', height: 10 }}
              />
              <span
                className="w-[3px] rounded-sm"
                style={{
                  background: accent,
                  animation: 'mpv-eq 0.9s ease-in-out 0.15s infinite',
                  height: 14,
                }}
              />
              <span
                className="w-[3px] rounded-sm"
                style={{
                  background: accent,
                  animation: 'mpv-eq 0.9s ease-in-out 0.3s infinite',
                  height: 8,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold truncate"
            style={{ color: isActive ? accent : 'white' }}
          >
            {song.title}
          </p>
          <p className="text-[12px] text-white/55 truncate">
            <span>{song.artist}</span>
            <span className="mx-1.5">•</span>
            <span>{formatRowDuration(song.duration)}</span>
          </p>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-11 h-11 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
            aria-label="More"
          >
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div
                className="absolute right-2 top-11 z-50 w-48 rounded-xl py-1.5 text-sm text-white shadow-2xl animate-fade-in"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5"
                  onClick={() => {
                    addToUserQueue(song);
                    toast.success(`"${song.title}" ditambahkan ke antrian`);
                    setMenuOpen(false);
                  }}
                >
                  <ListPlus size={16} /> Tambah ke Antrian
                </button>
                {isOwner && (
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-red-300"
                    onClick={async () => {
                      setMenuOpen(false);
                      if (!confirm(`Hapus "${song.title}" dari playlist?`)) return;
                      await onRemove();
                    }}
                  >
                    <Trash2 size={16} /> Hapus dari playlist
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showDivider && <div className="h-px bg-white/[0.06] mx-3 my-1" />}

      <style>{`@keyframes mpv-eq {
        0%, 100% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
      }`}</style>
    </li>
  );
}

// ───────────────────────────────────────────────────────── more sheet
function MoreBottomSheet({
  onClose,
  isOwner,
  isPublic,
  onEditCover,
  onToggleVisibility,
  onAddSongs,
  onShare,
  onDelete,
}: {
  onClose: () => void;
  isOwner: boolean;
  isPublic: boolean;
  onEditCover: () => void;
  onToggleVisibility: () => void;
  onAddSongs: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#1a1a1a] rounded-t-[20px] pb-8 text-white shadow-2xl"
        style={{ animation: 'mpv-slide-up 0.25s ease-out' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h3 className="font-semibold">Opsi Playlist</h3>
          <button onClick={onClose} className="text-white/60">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col">
          {isOwner && (
            <SheetItem icon={<Pencil size={18} />} label="Ganti cover" onClick={onEditCover} />
          )}
          {isOwner && (
            <SheetItem icon={<Plus size={18} />} label="Tambah lagu" onClick={onAddSongs} />
          )}
          {isOwner && (
            <SheetItem
              icon={isPublic ? <Lock size={18} /> : <Globe size={18} />}
              label={isPublic ? 'Jadikan Privat' : 'Jadikan Publik'}
              onClick={onToggleVisibility}
            />
          )}
          <SheetItem icon={<Share2 size={18} />} label="Bagikan" onClick={onShare} />
          <SheetItem
            icon={<Download size={18} />}
            label="Unduh (segera hadir)"
            onClick={() => toast.info('Fitur unduh segera hadir')}
          />
          {isOwner && (
            <SheetItem
              icon={<Trash2 size={18} />}
              label="Hapus playlist"
              destructive
              onClick={onDelete}
            />
          )}
        </div>
        <style>{`@keyframes mpv-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }`}</style>
      </div>
    </div>
  );
}

function SheetItem({
  icon,
  label,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-5 py-3.5 text-[15px] active:bg-white/5 transition-colors',
        destructive ? 'text-red-400' : 'text-white',
      )}
    >
      <span className="w-7 flex items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}
