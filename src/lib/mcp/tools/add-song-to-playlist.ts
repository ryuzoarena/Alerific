import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_song_to_playlist",
  title: "Add song to playlist",
  description: "Append an existing song to one of the signed-in user's playlists.",
  inputSchema: {
    playlist_id: z.string().uuid().describe("Target playlist id."),
    song_id: z.string().uuid().describe("Song id to add."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ playlist_id, song_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: last } = await supabase
      .from("playlist_songs")
      .select("position")
      .eq("playlist_id", playlist_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = (last?.position ?? -1) + 1;
    const { data, error } = await supabase
      .from("playlist_songs")
      .insert({ playlist_id, song_id, position })
      .select("playlist_id, song_id, position")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { entry: data },
    };
  },
});
