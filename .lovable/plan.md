# Playlist Upgrade Plan

## Current state
- Playlists live in `localStorage` via Zustand (`musicStore.playlists`). No DB table.
- `PlaylistView.tsx` shows header + song list with Play/Delete only.
- Songs are in Supabase `songs` table (read by anyone, write by authenticated).
- No `playlists` / `playlist_songs` tables, no `playlist-covers` bucket.

To deliver Feature 3 (public discovery + ownership + saving) playlists must move to Supabase. The other features can sit on top of that.

---

## Step 1 — Database migration (one migration call)

New tables + bucket:

```sql
-- playlists table
CREATE TABLE public.playlists (
  id uuid PK default gen_random_uuid(),
  owner_id uuid not null,            -- auth user id
  owner_username text,               -- denormalised from profiles.display_name
  name text not null,
  description text,
  cover_path text,                   -- in playlist-covers bucket
  is_public boolean not null default false,
  play_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- playlist_songs junction
CREATE TABLE public.playlist_songs (
  playlist_id uuid references playlists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz default now(),
  PRIMARY KEY (playlist_id, song_id)
);

-- saved_playlists (Feature 3 "Save to Library")
CREATE TABLE public.saved_playlists (
  user_id uuid not null,
  playlist_id uuid references playlists(id) on delete cascade,
  saved_at timestamptz default now(),
  PRIMARY KEY (user_id, playlist_id)
);
```

RLS:
- `playlists`: SELECT allowed if `is_public` OR `owner_id = auth.uid()` OR exists in `saved_playlists`. INSERT/UPDATE/DELETE only when `owner_id = auth.uid()`.
- `playlist_songs`: SELECT mirrors parent playlist visibility (via subquery). INSERT/DELETE only if owner.
- `saved_playlists`: SELECT/INSERT/DELETE only `user_id = auth.uid()`.

Storage:
- New bucket `playlist-covers` (public), with policies: anyone SELECT; authenticated INSERT/UPDATE/DELETE only inside `{auth.uid()}/...` folder.

Trigger: `update_updated_at_column` on `playlists`.

## Step 2 — Migrate musicStore.ts to DB-backed playlists

- Add `fetchPlaylists()` that loads owned + saved playlists from Supabase, joined with playlist_songs.
- Keep `Liked Songs` as a special local playlist OR convert to a per-user row (recommend: keep local for now, mark separately).
- Rewrite `createPlaylist`, `deletePlaylist`, `addSongToPlaylist`, `removeSongFromPlaylist` to call Supabase, then update local state.
- Add `setPlaylistVisibility(id, isPublic)`, `savePlaylistToLibrary(id)`, `unsavePlaylistFromLibrary(id)`, `updatePlaylistCover(id, file)`.
- Remove playlists from `persist.partialize` (they come from DB now).
- Call `fetchPlaylists()` on auth ready in `App.tsx`.

## Step 3 — Feature 1: Add Songs picker (`AddSongsToPlaylistDialog.tsx`)

- Reuse shadcn `Dialog`. Search input filters `songs` by title/artist.
- Checkbox list with already-in-playlist items pre-checked & disabled.
- Sticky footer: `[Cancel] [Add N songs]` (green when N>0).
- On confirm: batch `addSongToPlaylist` calls.
- New outlined "+ Add Songs" button rendered next to existing Play/Delete in `PlaylistView.tsx` header. Only shown for owner.

## Step 4 — Feature 2: Mobile FAB + Create Playlist sheet

- New `CreatePlaylistSheet.tsx`: uses shadcn `Sheet` from `bottom` on mobile (`max-width:1024px`), `Dialog` centered on desktop (single component, responsive via `useIsMobile`).
- Fields: name (required), description, cover photo picker (square 120×120 drop zone w/ preview, compressed via existing `compressImage`).
- New `<CreatePlaylistFab />` rendered in `Index.tsx`: fixed bottom-right, only `lg:hidden`, opens the sheet.
- Sidebar "+" button keeps working; on desktop it opens the same dialog.

## Step 5 — Feature 3: Public discovery

- Visibility toggle in `PlaylistView` header (owner only): "🌐 Public / 🔒 Private" pill, calls `setPlaylistVisibility`.
- Extend `SearchView.tsx`: query Supabase `playlists` where `is_public ilike %q%` (name/owner). Render new "Playlists" section above/below songs with card → owner name, song count, public badge.
- Public playlist viewing: same `PlaylistView` route, but when `playlist.owner_id !== auth.uid()`:
  - Hide Add Songs / Delete / Visibility toggle.
  - Show owner avatar + username at top.
  - Replace Delete with `❤️ Save to Library` (toggles `saved_playlists`).
- "Saved" playlists appear in sidebar Library alongside owned ones (visually identical, no edit affordances).

## Step 6 — Feature 4: Mobile scroll fixes

- Add CSS classes in `src/index.css` scoped behind `@media (max-width:1024px)`:
  - `.playlist-songs-container` (vertical momentum + overscroll containment + `touch-action: pan-y`).
  - Tighten `HorizontalScroller` mobile branch: add `scroll-snap-type: x mandatory` and `scroll-snap-align: start` on direct children, hide scrollbar (already mostly done).
- Apply `.playlist-songs-container` to song-list wrapper in `PlaylistView`.
- Add drag-to-dismiss to `CreatePlaylistSheet` mobile variant (already partly handled by Radix Sheet swipe close; verify and supplement with touch handlers if needed).
- No desktop changes.

## Step 7 — Feature 5: Cover photo

- Upload helper `uploadPlaylistCover(file, playlistId)` in `lib/cloudStorage.ts`: compress to 400×400 JPEG (reuse `compressImage`), upload to `playlist-covers/{owner_id}/{playlistId}.jpg`, save `cover_path`.
- Create-playlist flow uses it before insert (upload after the playlist row exists so we have the id; or upload to temp path then rename — simpler: insert row, then upload, then update `cover_path`).
- Existing playlist: hover overlay "📷 Change Cover" on header art (desktop) / tap-to-change on mobile, reuses existing `CoverCropDialog` (square crop).
- Auto-generated 2×2 collage when `cover_path` is null and playlist has ≥4 songs:
  - New component `PlaylistCoverArt.tsx` that renders either `<img>` (uploaded), CSS grid of 4 album covers, or gradient fallback (1–3 songs).
  - Used in `PlaylistView` header, `Sidebar` thumbnails, search result cards.

---

## Technical notes

- All new client calls go through `@/integrations/supabase/client`.
- `owner_username` is denormalised at insert time from the user's profile to avoid a join on every search; refresh on profile update is out of scope.
- `play_count` increments are deferred (not part of this scope unless trivial — leaving the column for future use).
- Existing local-only `Liked Songs` playlist stays local; we won't migrate it to keep behaviour.
- Existing localStorage playlists will be lost after migration since we drop them from persist. Acceptable given current state (only one empty playlist visible).

---

## Order of execution

1. Run DB migration + storage bucket (one `supabase--migration` call → wait for approval).
2. Refactor `musicStore.ts` to DB-backed playlists + extend `cloudStorage.ts`.
3. Build `PlaylistCoverArt`, `AddSongsToPlaylistDialog`, `CreatePlaylistSheet`, `CreatePlaylistFab`.
4. Update `PlaylistView` (buttons, visibility toggle, owner-aware UI, cover change).
5. Update `Sidebar` (use `PlaylistCoverArt`, wire new dialog) and `Index` (mount FAB).
6. Extend `SearchView` with public playlists section.
7. Mobile-only scroll CSS + apply class to playlist list.
8. Smoke-test in preview at 390×722 + desktop.

This is sizeable — confirm and I'll start with the migration.
