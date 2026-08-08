import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_songs",
  title: "Search songs",
  description: "Search the music library by song title, artist, or album.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to match against title, artist, or album."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const pattern = `%${query.replace(/[%_]/g, "")}%`;
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, album, duration")
      .or(`title.ilike.${pattern},artist.ilike.${pattern},album.ilike.${pattern}`)
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { songs: data ?? [] },
    };
  },
});
