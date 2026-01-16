import { NextResponse } from "next/server";

import { convexClient } from "@/lib/server/convexClient";
import { getGoogleProfile } from "@/lib/server/googleAuth";
import { api } from "@/convex/_generated/api";

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  
  const profile = await getGoogleProfile();
  if (!profile?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = convexClient();
  const user = await client.query(api.users.getUserByEmail, {
    email: profile.email,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await client.mutation(api.tasks.deleteTask, {
    userId: user._id,
    clientId: id,
  });

  return NextResponse.json({ success: true });
};

