import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export const getGoogleAccessToken = async () => {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(
      userId,
      "oauth_google"
    );

    const accessToken = tokens?.data?.[0]?.token ?? null;
    return accessToken;
  } catch (error) {
    console.error("Clerk Google token error", error);
    return null;
  }
};

export const getGoogleProfile = async () => {
  const user = await currentUser();
  if (!user) {
    return null;
  }

  return {
    email: user.primaryEmailAddress?.emailAddress ?? "",
    name: user.fullName ?? undefined,
    picture: user.imageUrl ?? undefined,
    sub: user.id,
  };
};

