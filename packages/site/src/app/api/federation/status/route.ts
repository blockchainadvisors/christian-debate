import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { federatedIdentity } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [record] = await db
    .select()
    .from(federatedIdentity)
    .where(eq(federatedIdentity.localUserId, session.user.id))
    .limit(1);

  if (record) {
    return NextResponse.json({
      linked: true,
      hubUserId: record.hubUserId,
      linkedAt: record.linkedAt,
      syncedAt: record.syncedAt,
    });
  }

  return NextResponse.json({ linked: false });
}
