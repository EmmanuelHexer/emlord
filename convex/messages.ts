import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const results = await ctx.db
      .query("messages")
      .order("desc")
      .paginate(paginationOpts);

    const userCache = new Map<string, string>();
    const page = await Promise.all(
      results.page.map(async (message) => {
        let userName = userCache.get(message.userId);
        if (!userName) {
          const user = await ctx.db.get(message.userId);
          userName = user?.name ?? user?.email ?? "Unknown";
          userCache.set(message.userId, userName);
        }
        return {
          _id: message._id,
          _creationTime: message._creationTime,
          userId: message.userId,
          body: message.body,
          userName,
        };
      })
    );

    return { ...results, page };
  },
});

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, { body }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    await ctx.db.insert("messages", { userId, body });
  },
});
