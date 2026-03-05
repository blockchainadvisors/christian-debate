import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { refreshUserTrustTier } from "@/lib/moderation/trust-tiers";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Job-Secret");
  if (!secret || secret !== process.env.JOB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({ id: users.id, trustTier: users.trustTier })
    .from(users);

  let processed = 0;
  let upgraded = 0;

  for (const user of allUsers) {
    // Skip moderator/admin
    if (user.trustTier === "moderator" || user.trustTier === "admin") {
      continue;
    }

    const previousTier = user.trustTier;
    await refreshUserTrustTier(user.id);

    // Re-fetch to check if upgraded
    const [updated] = await db
      .select({ trustTier: users.trustTier })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    processed++;

    if (updated && updated.trustTier !== previousTier) {
      upgraded++;
    }
  }

  return NextResponse.json({ processed, upgraded });
}
