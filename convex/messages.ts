import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { requireAuth, validateString, throwError } from "./lib/serverErrors";

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { conversationId, paginationOpts }) => {
    const results = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("desc")
      .paginate(paginationOpts);

    const userCache = new Map<string, string>();
    const page = await Promise.all(
      results.page.map(async (message) => {
        let userName = userCache.get(message.authorId);
        if (!userName) {
          const user = await ctx.db.get(message.authorId);
          userName = user?.name ?? user?.email ?? "Unknown";
          userCache.set(message.authorId, userName);
        }
        return {
          _id: message._id,
          _creationTime: message._creationTime,
          authorId: message.authorId,
          body: message.body,
          userName,
        };
      })
    );

    return { ...results, page };
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  handler: async (ctx, { conversationId, body }) => {
    const userId = await requireAuth(ctx);

    // Verify membership
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId_conversationId", (q) =>
        q.eq("userId", userId).eq("conversationId", conversationId)
      )
      .unique();

    if (!membership) {
      throwError("You are not a member of this conversation");
    }

    const text = validateString(body, "Message", { max: 1000 });

    await ctx.db.insert("messages", {
      conversationId,
      authorId: userId,
      body: text,
    });

    // Denormalize last message on conversation
    const author = await ctx.db.get(userId);
    await ctx.db.patch(conversationId, {
      lastMessageText: text.length > 50 ? text.slice(0, 50) + "..." : text,
      lastMessageTime: Date.now(),
      lastMessageAuthor: userId,
    });
  },
});
