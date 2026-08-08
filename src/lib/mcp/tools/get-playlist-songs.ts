import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_playlist_songs",
  title: "Get playlist songs",
  description: "List the songs inside a playlist the signed-in user can access.",
  inputSchema: {
    playlist_id: z.string().uuid().describe("The playlist id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ playlist_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("playlist_songs")
      .select("position, songs(id, title, artist, album, duration)")
      .eq("playlist_id", playlist_id)
      .order("position", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const songs = (data ?? []).map((row: { position: number; songs: unknown }) => ({
      position: row.position,
      ...(row.songs as Record<string, unknown> | null),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(songs) }],
      structuredContent: { songs },
    };
  },
});
