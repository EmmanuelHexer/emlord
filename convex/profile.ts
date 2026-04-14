import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, validateString } from "./lib/serverErrors";

export const setName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireAuth(ctx);
    const trimmed = validateString(name, "Name", { min: 1, max: 50 });
    await ctx.db.patch(userId, { name: trimmed });
  },
});
