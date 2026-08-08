import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_playlist",
  title: "Create playlist",
  description: "Create a new playlist owned by the signed-in user.",
  inputSchema: {
    name: z.string().trim().min(1).max(120).describe("Playlist name."),
    description: z.string().trim().max(500).optional().describe("Optional description."),
    is_public: z.boolean().optional().describe("Make the playlist publicly discoverable."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, description, is_public }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        owner_id: ctx.getUserId(),
        name,
        description: description ?? null,
        is_public: is_public ?? false,
      })
      .select("id, name, description, is_public")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { playlist: data },
    };
  },
});
