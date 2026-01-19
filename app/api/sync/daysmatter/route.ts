import { NextResponse } from "next/server";

import type { DaysMatterItem } from "@/lib/types";
import { convexClient } from "@/lib/server/convexClient";
import { getGoogleProfile } from "@/lib/server/googleAuth";
import { api } from "@/convex/_generated/api";

type ConvexDaysMatterItem = {
  _id: string;
  clientId?: string;
  title: string;
  description?: string;
  targetDate: string;
  type: "countdown" | "countup";
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

const mapDaysMatterFromConvex = (
  item: ConvexDaysMatterItem
): DaysMatterItem => ({
  id: item.clientId ?? item._id,
  title: item.title,
  description: item.description ?? undefined,
  targetDate: item.targetDate,
  type: item.type,
  imageUrl: item.imageUrl ?? undefined,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt ?? undefined,
  convexId: item._id,
});

export const GET = async () => {
  const profile = await getGoogleProfile();
  if (!profile?.email) {
    return NextResponse.json(
      { userExists: false, items: [] },
      { status: 401 }
    );
  }

  const client = convexClient();
  const user = await client.query(api.users.getUserByEmail, {
    email: profile.email,
  });

  if (!user) {
    return NextResponse.json({ userExists: false, items: [] });
  }

  const items = await client.query(api.daysMatter.getDaysMatterByUser, {
    userId: user._id,
  });

  return NextResponse.json({
    userExists: true,
    items: items.map(mapDaysMatterFromConvex),
  });
};

export const POST = async (request: Request) => {
  const profile = await getGoogleProfile();
  if (!profile?.email) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const body = (await request.json()) as { items?: DaysMatterItem[] };
  const items = body.items ?? [];

  const client = convexClient();
  const user = await client.mutation(api.users.upsertUser, {
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleSub: profile.sub,
  });

  if (!user) {
    return NextResponse.json({ items: [] }, { status: 500 });
  }

  if (!items.length) {
    return NextResponse.json({ items: [] });
  }

  const synced = await client.mutation(api.daysMatter.bulkUpsertDaysMatterItems, {
    userId: user._id,
    items: items.map((item) => ({
      clientId: item.id,
      title: item.title,
      description: item.description,
      targetDate: item.targetDate,
      type: item.type,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });

  return NextResponse.json({
    items: synced.map(mapDaysMatterFromConvex),
  });
};

