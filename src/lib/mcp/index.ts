import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchSongsTool from "./tools/search-songs";
import listPlaylistsTool from "./tools/list-playlists";
import getPlaylistSongsTool from "./tools/get-playlist-songs";
import createPlaylistTool from "./tools/create-playlist";
import addSongToPlaylistTool from "./tools/add-song-to-playlist";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "harmony-hub",
  title: "Harmony Hub",
  version: "0.1.0",
  instructions:
    "Tools for Harmony Hub, a music streaming app. Search the song library, browse the signed-in user's playlists, read playlist contents, create playlists, and add songs to them.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchSongsTool,
    listPlaylistsTool,
    getPlaylistSongsTool,
    createPlaylistTool,
    addSongToPlaylistTool,
  ],
});
