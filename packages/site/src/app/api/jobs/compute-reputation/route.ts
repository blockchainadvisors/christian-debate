import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { computeReputation } from "@/lib/reputation";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Job-Secret");
  if (!secret || secret !== process.env.JOB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({ id: users.id })
    .from(users);

  let processed = 0;

  for (const user of allUsers) {
    const { reputationScore, persuasionRating } = await computeReputation(
      user.id
    );

    await db
      .update(users)
      .set({ reputationScore, persuasionRating })
      .where(eq(users.id, user.id));

    processed++;
  }

  return NextResponse.json({ processed });
}
