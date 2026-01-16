import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
    googleSub: v.optional(v.string()),
    customCategories: v.optional(v.array(v.string())),
    createdAt: v.string(),
  }).index("by_email", ["email"]),
  tasks: defineTable({
    userId: v.id("users"),
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
    .index("by_user", ["userId"])
    .index("by_user_client", ["userId", "clientId"]),
});


