import { NextResponse } from "next/server";

import type { Task } from "@/lib/types";
import { convexClient } from "@/lib/server/convexClient";
import { getGoogleProfile } from "@/lib/server/googleAuth";
import { api } from "@/convex/_generated/api";

const mapTaskFromConvex = (task: any): Task => ({
  id: task.clientId ?? task._id,
  title: task.title,
  description: task.description ?? undefined,
  deadline: task.deadline,
  category: task.category,
  importance: task.importance,
  completed: task.completed,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt ?? undefined,
  subtasks: task.subtasks ?? [],
  convexId: task._id,
});

export const GET = async () => {
  const profile = await getGoogleProfile();
  if (!profile?.email) {
    return NextResponse.json({ userExists: false, tasks: [] }, { status: 401 });
  }

  const client = convexClient();
  const user = await client.query(api.users.getUserByEmail, {
    email: profile.email,
  });

  if (!user) {
    return NextResponse.json({ userExists: false, tasks: [] });
  }

  const tasks = await client.query(api.tasks.getTasksByUser, {
    userId: user._id,
  });

  return NextResponse.json({
    userExists: true,
    tasks: tasks.map(mapTaskFromConvex),
  });
};

export const POST = async (request: Request) => {
  const profile = await getGoogleProfile();
  if (!profile?.email) {
    return NextResponse.json({ tasks: [] }, { status: 401 });
  }

  const body = (await request.json()) as { tasks?: Task[] };
  const tasks = body.tasks ?? [];

  const client = convexClient();
  const user = await client.mutation(api.users.upsertUser, {
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleSub: profile.sub,
  });

  if (!user) {
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }

  if (!tasks.length) {
    return NextResponse.json({ tasks: [] });
  }

  const synced = await client.mutation(api.tasks.bulkUpsertTasks, {
    userId: user._id,
    tasks: tasks.map((task) => ({
      clientId: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      category: task.category,
      importance: task.importance,
      completed: task.completed,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      subtasks: task.subtasks,
    })),
  });

  return NextResponse.json({
    tasks: synced.map(mapTaskFromConvex),
  });
};


