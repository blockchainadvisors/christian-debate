import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { federatedIdentity } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { hubUserId } = body as { hubUserId: string };

  if (!hubUserId) {
    return NextResponse.json(
      { error: "hubUserId is required" },
      { status: 400 },
    );
  }

  // Check if already linked
  const [existing] = await db
    .select()
    .from(federatedIdentity)
    .where(eq(federatedIdentity.localUserId, session.user.id))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Account is already linked to a hub user" },
      { status: 409 },
    );
  }

  const [record] = await db
    .insert(federatedIdentity)
    .values({
      localUserId: session.user.id,
      hubUserId,
    })
    .returning();

  return NextResponse.json(record);
}
