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
      customCategories: ["Work", "School", "Fitness"],
      createdAt: new Date().toISOString(),
    });

    return await ctx.db.get(id);
  },
});

export const updateCustomCategories = mutation({
  args: {
    email: v.string(),
    categories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      customCategories: args.categories,
    });

    return { success: true };
  },
});

export const getCustomCategories = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return [];
    }

    return user.customCategories ?? ["Work", "School", "Fitness"];
  },
});

