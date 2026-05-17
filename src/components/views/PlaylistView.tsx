import { useEffect, useMemo, useRef, useState } from 'react';
import { useMusicStore } from '@/stores/musicStore';
import { SongCard } from '@/components/SongCard';
import { PlaylistCoverArt } from '@/components/PlaylistCoverArt';
import { AddSongsToPlaylistDialog } from '@/components/AddSongsToPlaylistDialog';
import { MobilePlaylistView } from '@/components/views/MobilePlaylistView';
import { Play, Music2, Trash2, Plus, Globe, Lock, Camera, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/lib/imageCompress';
import { toast } from 'sonner';

interface PlaylistViewProps {
  playlistId: string;
  isDeleteMode?: boolean;
}

export function PlaylistView({ playlistId, isDeleteMode }: PlaylistViewProps) {
  const {
    playlists,
    songs,
    playSong,
    deletePlaylist,
    setPlaylistVisibility,
    updatePlaylistCover,
    savePlaylistToLibrary,
    unsavePlaylistFromLibrary,
  } = useMusicStore();
  const timeTheme = useTimeTheme();
  const { user } = useAuth();
  const [showAddSongs, setShowAddSongs] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const playlist = playlists.find((p) => p.id === playlistId);
  const playlistSongs = useMemo(
    () => (playlist?.songIds || []).map((id) => songs.find((s) => s.id === id)).filter(Boolean) as typeof songs,
    [playlist?.songIds, songs],
  );

  if (!playlist) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Playlist not found</p>
      </div>
    );
  }

  const isLiked = playlist.id === 'liked';
  const isOwner = isLiked || (!!user && playlist.owner_id === user.id);
  const isSavedByMe = !!playlist.isSaved;

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) playSong(playlistSongs[0], playlistSongs);
  };

  const handleDeletePlaylist = async () => {
    if (!confirm(`Delete playlist "${playlist.name}"?`)) return;
    await deletePlaylist(playlist.id);
  };

  const handleToggleVisibility = async () => {
    if (!isOwner || isLiked) return;
    await setPlaylistVisibility(playlist.id, !playlist.is_public);
    toast.success(playlist.is_public ? 'Playlist set to Private' : 'Playlist is now Public');
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

  return (
    <div className="h-full overflow-y-auto pb-24 playlist-songs-container">
      {/* Header */}
      <div className="relative">
        <div
          className={cn(
            'h-64',
            isLiked
              ? 'bg-gradient-to-b from-indigo-600/60 to-background'
              : 'bg-gradient-to-b from-primary/30 to-background',
          )}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
          {/* Cover with hover-to-change overlay (owner only) */}
          <div className="relative group">
            <PlaylistCoverArt
              playlist={playlist}
              songs={playlistSongs}
              size={224}
              rounded="rounded shadow-2xl"
            />
            {isOwner && !isLiked && (
              <>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  title="Change cover"
                >
                  <Camera size={28} />
                  <span>Change Cover</span>
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium">Playlist</p>
              {!isLiked && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full',
                    playlist.is_public ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60',
                  )}
                >
                  {playlist.is_public ? <Globe size={10} /> : <Lock size={10} />}
                  {playlist.is_public ? 'Public' : 'Private'}
                </span>
              )}
            </div>
            <h1 className="text-5xl font-bold mb-3 truncate">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-2 truncate">{playlist.description}</p>
            )}
            <p className="text-muted-foreground text-sm">
              {playlist.owner_username && !isLiked && (
                <>
                  <span className="text-white font-medium">{playlist.owner_username}</span>
                  <span className="mx-1.5">•</span>
                </>
              )}
              {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={handlePlayAll}
          disabled={playlistSongs.length === 0}
          className={`w-14 h-14 theme-transition ${timeTheme.accentBg} rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100`}
        >
          <Play size={28} className={`theme-transition ${timeTheme.buttonText} ml-1`} fill="currentColor" />
        </button>

        {isOwner && !isLiked && (
          <>
            <button
              onClick={handleDeletePlaylist}
              className="p-3 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete playlist"
            >
              <Trash2 size={22} />
            </button>

            <button
              onClick={() => setShowAddSongs(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus size={16} /> Add Songs
            </button>

            <button
              onClick={handleToggleVisibility}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
              title={playlist.is_public ? 'Make private' : 'Make public'}
            >
              {playlist.is_public ? <Globe size={14} /> : <Lock size={14} />}
              {playlist.is_public ? 'Public' : 'Private'}
            </button>
          </>
        )}

        {!isOwner && user && (
          <button
            onClick={handleSaveToggle}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors',
              isSavedByMe ? 'bg-primary/20 text-primary' : 'text-white',
            )}
            style={{ border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <Heart size={16} fill={isSavedByMe ? 'currentColor' : 'none'} />
            {isSavedByMe ? 'Saved' : 'Save to Library'}
          </button>
        )}
      </div>

      {/* Track list */}
      <div className="px-4 py-2">
        {playlistSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={64} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">No songs in this playlist</h2>
            <p className="text-muted-foreground mb-4">
              {isOwner ? 'Add songs from your library to get started' : 'This playlist is empty'}
            </p>
            {isOwner && !isLiked && (
              <button
                onClick={() => setShowAddSongs(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium text-white"
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <Plus size={16} /> Add Songs
              </button>
            )}
          </div>
        ) : (
          playlistSongs.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              index={index}
              showIndex
              queue={playlistSongs}
              isDeleteMode={isDeleteMode && isOwner}
            />
          ))
        )}
      </div>

      <AddSongsToPlaylistDialog
        isOpen={showAddSongs}
        onClose={() => setShowAddSongs(false)}
        playlistId={playlist.id}
      />
    </div>
  );
}
