import "server-only";

import { ConvexHttpClient } from "convex/browser";

export const convexClient = () => {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing CONVEX_URL env var");
  }
  return new ConvexHttpClient(url);
};


