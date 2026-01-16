import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTasksByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const bulkUpsertTasks = mutation({
  args: {
    userId: v.id("users"),
    tasks: v.array(
      v.object({
        clientId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        deadline: v.string(),
        categories: v.array(v.string()),
        importance: v.number(),
        completed: v.boolean(),
        createdAt: v.string(),
        updatedAt: v.optional(v.string()),
        subtasks: v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            completed: v.boolean(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const task of args.tasks) {
      const existing = await ctx.db
        .query("tasks")
        .withIndex("by_user_client", (q) =>
          q.eq("userId", args.userId).eq("clientId", task.clientId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          categories: task.categories,
          importance: task.importance,
          completed: task.completed,
          updatedAt: task.updatedAt ?? new Date().toISOString(),
          subtasks: task.subtasks,
        });
        const updated = await ctx.db.get(existing._id);
        if (updated) results.push(updated);
      } else {
        const id = await ctx.db.insert("tasks", {
          userId: args.userId,
          clientId: task.clientId,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          categories: task.categories,
          importance: task.importance,
          completed: task.completed,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          subtasks: task.subtasks,
        });
        const inserted = await ctx.db.get(id);
        if (inserted) results.push(inserted);
      }
    }

    return results;
  },
});

export const deleteTask = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user_client", (q) =>
        q.eq("userId", args.userId).eq("clientId", args.clientId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

