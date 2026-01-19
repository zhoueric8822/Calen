import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for clients to upload files directly to Convex storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get the URL for a stored file
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete a file from storage
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.delete(args.storageId);
  },
});

