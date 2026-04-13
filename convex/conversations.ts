import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAuth, validateString } from "./lib/serverErrors";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const userCache = new Map<string, { name?: string; email?: string }>();

    const getUser = async (id: Id<"users">) => {
      let cached = userCache.get(id);
      if (!cached) {
        const user = await ctx.db.get(id);
        cached = { name: user?.name, email: user?.email };
        userCache.set(id, cached);
      }
      return cached;
    };

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) return null;

        const members = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", membership.conversationId)
          )
          .collect();

        const memberUsers = await Promise.all(
          members.map(async (m) => {
            const user = await getUser(m.userId);
            return { userId: m.userId, role: m.role, ...user };
          })
        );

        // For DMs, use the other person's name as the display name
        let displayName = conversation.name;
        if (conversation.type === "dm") {
          const other = memberUsers.find((m) => m.userId !== userId);
          displayName = other?.name ?? other?.email ?? "Unknown";
        }

        return {
          _id: conversation._id,
          type: conversation.type,
          displayName: displayName ?? "Unnamed group",
          lastMessageText: conversation.lastMessageText,
          lastMessageTime: conversation.lastMessageTime,
          members: memberUsers,
        };
      })
    );

    return results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
  },
});

export const createDM = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, { otherUserId }) => {
    const userId = await requireAuth(ctx);

    // Check if DM already exists
    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const membership of myMemberships) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation || conversation.type !== "dm") continue;

      const otherMembership = await ctx.db
        .query("conversationMembers")
        .withIndex("by_userId_conversationId", (q) =>
          q.eq("userId", otherUserId).eq("conversationId", membership.conversationId)
        )
        .unique();

      if (otherMembership) return membership.conversationId;
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", { type: "dm" });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      role: "member",
      joinedAt: now,
    });
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: otherUserId,
      role: "member",
      joinedAt: now,
    });

    return conversationId;
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, { name, memberIds }) => {
    const userId = await requireAuth(ctx);
    const groupName = validateString(name, "Group name", { max: 50 });

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      type: "group",
      name: groupName,
      creatorId: userId,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    const uniqueMembers = [...new Set(memberIds.filter((id) => id !== userId))];
    await Promise.all(
      uniqueMembers.map((memberId) =>
        ctx.db.insert("conversationMembers", {
          conversationId,
          userId: memberId,
          role: "member",
          joinedAt: now,
        })
      )
    );

    return conversationId;
  },
});

export const allUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u._id !== userId)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
      }));
  },
});
