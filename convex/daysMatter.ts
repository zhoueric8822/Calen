import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getDaysMatterByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("daysMatter")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const bulkUpsertDaysMatterItems = mutation({
  args: {
    userId: v.id("users"),
    items: v.array(
      v.object({
        clientId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        targetDate: v.string(),
        type: v.union(v.literal("countdown"), v.literal("countup")),
        imageUrl: v.optional(v.string()),
        createdAt: v.string(),
        updatedAt: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const item of args.items) {
      const existing = await ctx.db
        .query("daysMatter")
        .withIndex("by_user_client", (q) =>
          q.eq("userId", args.userId).eq("clientId", item.clientId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: item.title,
          description: item.description,
          targetDate: item.targetDate,
          type: item.type,
          imageUrl: item.imageUrl,
          updatedAt: item.updatedAt ?? new Date().toISOString(),
        });
        const updated = await ctx.db.get(existing._id);
        if (updated) results.push(updated);
      } else {
        const id = await ctx.db.insert("daysMatter", {
          userId: args.userId,
          clientId: item.clientId,
          title: item.title,
          description: item.description,
          targetDate: item.targetDate,
          type: item.type,
          imageUrl: item.imageUrl,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
        const inserted = await ctx.db.get(id);
        if (inserted) results.push(inserted);
      }
    }

    return results;
  },
});

export const deleteDaysMatterItem = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("daysMatter")
      .withIndex("by_user_client", (q) =>
        q.eq("userId", args.userId).eq("clientId", args.clientId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

