import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const categories = await fetchQuery(api.users.getCustomCategories, {
      email,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to get categories:", error);
    return NextResponse.json(
      { error: "Failed to get categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, categories } = body;

    if (!email || !categories) {
      return NextResponse.json(
        { error: "Email and categories required" },
        { status: 400 }
      );
    }

    await fetchMutation(api.users.updateCustomCategories, {
      email,
      categories,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update categories:", error);
    return NextResponse.json(
      { error: "Failed to update categories" },
      { status: 500 }
    );
  }
}
