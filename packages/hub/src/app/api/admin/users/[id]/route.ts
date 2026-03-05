import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hubUsers, profileLinks, reputationSnapshots } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminToken = process.env.HUB_ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json(
      { error: "Admin not configured" },
      { status: 500 },
    );
  }

  const { id } = await params;

  // Check user exists
  const [user] = await db
    .select({ id: hubUsers.id })
    .from(hubUsers)
    .where(eq(hubUsers.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Delete related records first, then the user
  await db
    .delete(reputationSnapshots)
    .where(eq(reputationSnapshots.hubUserId, id));
  await db.delete(profileLinks).where(eq(profileLinks.hubUserId, id));
  await db.delete(hubUsers).where(eq(hubUsers.id, id));

  return NextResponse.json({ success: true });
}
