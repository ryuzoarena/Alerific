import { ArrowLeft, Play, Shuffle, Plus, MoreVertical, Download, Filter, MoreHorizontal } from 'lucide-react';
import { useMusicStore } from '@/stores/musicStore';
import { SongCard } from '@/components/SongCard';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { useDominantColor, useDominantPalette } from '@/hooks/useDominantColor';
import { useMemo } from 'react';

interface ArtistViewProps {
  artistName: string;
  onBack: () => void;
  isDeleteMode?: boolean;
}

export function ArtistView({ artistName, onBack, isDeleteMode }: ArtistViewProps) {
  const { songs, playSong, playerState, toggleShuffle } = useMusicStore();
  const timeTheme = useTimeTheme();

  const artistSongs = useMemo(
    () => songs.filter(s => s.artist.toLowerCase() === artistName.toLowerCase()),
    [songs, artistName]
  );

  const coverUrl = artistSongs.find(s => s.coverUrl)?.coverUrl;
  const dominantColor = useDominantColor(coverUrl || null);
  const palette = useDominantPalette(coverUrl || null);

  const totalDuration = useMemo(() => {
    const total = artistSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
    const hrs = Math.floor(total / 3600);
    const mins = Math.round((total % 3600) / 60);
    return hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
  }, [artistSongs]);

  const handlePlayAll = () => {
    if (artistSongs.length > 0) {
      playSong(artistSongs[0], artistSongs);
    }
  };

  const handleShufflePlay = () => {
    if (artistSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * artistSongs.length);
      playSong(artistSongs[randomIndex], artistSongs);
      if (!playerState.shuffle) toggleShuffle();
    }
  };

  const bgStyle = dominantColor
    ? { background: `linear-gradient(to bottom, ${dominantColor} 0%, hsl(var(--background)) 100%)` }
    : undefined;

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* ==================== DESKTOP HERO (≥1100px) ==================== */}
      <div className="hidden min-[1100px]:block px-6 pt-6">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/5 p-8"
          style={{
            background: `radial-gradient(120% 140% at 85% 20%, ${palette.accentSoft} 0%, transparent 60%), linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)`,
          }}
        >
          <div className="flex items-end gap-8">
            {/* Cover */}
            <div
              className="w-56 h-56 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl"
              style={{ boxShadow: `0 24px 60px -18px ${palette.accentGlow}` }}
            >
              {coverUrl ? (
                <img src={coverUrl} alt={artistName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <span className="text-6xl font-bold text-foreground/70">
                    {artistName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-xs font-bold tracking-[0.25em] text-muted-foreground uppercase">
                Artist
              </p>
              <h1 className="mt-3 text-6xl font-black tracking-tight text-foreground truncate">
                {artistName}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">Semua lagu dari {artistName}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {artistSongs.length} lagu • {totalDuration}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handlePlayAll}
                  className={`px-9 h-12 rounded-full font-extrabold tracking-widest text-sm theme-transition ${timeTheme.accentBg} ${timeTheme.buttonText} hover:scale-[1.03] transition-transform`}
                  style={{ boxShadow: `0 12px 32px -10px ${palette.accentGlow}` }}
                >
                  PLAY
                </button>
                <button
                  onClick={handleShufflePlay}
                  className="px-9 h-12 rounded-full border border-white/20 text-foreground font-extrabold tracking-widest text-sm hover:border-white/40 hover:bg-white/5 transition-colors"
                >
                  SHUFFLE
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Download size={20} />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 flex items-center justify-between px-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
          <span className="flex items-center gap-2">
            <Filter size={14} /> Filter
          </span>
          <span>Artist</span>
          <span className="flex items-center gap-2">
            <Download size={14} /> Download
          </span>
        </div>
      </div>

      {/* ==================== MOBILE / TABLET HEADER (<1100px) ==================== */}
      <div className="min-[1100px]:hidden">
      {/* Header with dominant color gradient */}
      <div className="relative pt-4 pb-6 px-4" style={bgStyle}>
        {!dominantColor && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-background" />
        )}


        {/* Back button */}
        <button
          onClick={onBack}
          className="relative z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors mb-4"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {/* Centered cover art */}
        <div className="relative z-10 flex justify-center mb-5">
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-md overflow-hidden shadow-2xl">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={artistName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                <span className="text-5xl font-bold text-foreground/70">
                  {artistName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Artist name and info */}
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
            {artistName}
          </h1>

          {/* Artist avatar + name row */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary flex-shrink-0">
              {coverUrl ? (
                <img src={coverUrl} alt={artistName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground/70">{artistName.charAt(0)}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-white/90">{artistName}</span>
          </div>

          <p className="text-xs text-white/60 mt-1">
            {artistSongs.length} lagu
          </p>
        </div>

        {/* Action buttons row */}
        <div className="relative z-10 flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {/* Small cover thumbnail */}
            <div className="w-10 h-10 rounded-sm overflow-hidden shadow-md">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/30" />
              )}
            </div>
            <button className="text-white/70 hover:text-white transition-colors">
              <Plus size={24} />
            </button>
            <button className="text-white/70 hover:text-white transition-colors">
              <Download size={24} />
            </button>
            <button className="text-white/70 hover:text-white transition-colors">
              <MoreVertical size={24} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShufflePlay}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <Shuffle size={24} />
            </button>
            <button
              onClick={handlePlayAll}
              className={`w-14 h-14 rounded-full theme-transition ${timeTheme.accentBg} flex items-center justify-center shadow-xl hover:scale-105 transition-transform`}
            >
              <Play size={24} className={`${timeTheme.buttonText} ml-0.5`} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="px-2 sm:px-4">
        <div className="space-y-0.5">
          {artistSongs.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              index={index}
              showIndex
              queue={artistSongs}
              isDeleteMode={isDeleteMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
