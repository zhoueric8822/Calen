import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
    googleSub: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        picture: args.picture ?? existing.picture,
        googleSub: args.googleSub ?? existing.googleSub,
      });
      return existing;
    }

    const id = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      picture: args.picture,
      googleSub: args.googleSub,
      createdAt: new Date().toISOString(),
    });

    return await ctx.db.get(id);
  },
});

