import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { federatedIdentity } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .delete(federatedIdentity)
    .where(eq(federatedIdentity.localUserId, session.user.id));

  return NextResponse.json({ unlinked: true });
}
