import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_playlists",
  title: "List playlists",
  description: "List the signed-in user's playlists, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max playlists (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("playlists")
      .select("id, name, description, is_public, play_count, created_at")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { playlists: data ?? [] },
    };
  },
});
