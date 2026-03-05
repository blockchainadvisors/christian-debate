import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteRegistrations } from "@/db/schema";
import { checkHubAdmin } from "@/lib/auth";

/** GET /api/sites/[id] — get a single site (admin only) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkHubAdmin(req);
  if (denied) return denied;

  const { id } = await params;

  const [site] = await db
    .select()
    .from(siteRegistrations)
    .where(eq(siteRegistrations.id, id));

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  return NextResponse.json(site);
}

/** PATCH /api/sites/[id] — update a site (admin only) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkHubAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  const allowedFields = ["name", "niche", "trustStatus"] as const;
  const updates: Record<string, string> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (
        field === "trustStatus" &&
        !["pending", "verified", "suspended"].includes(body[field])
      ) {
        return NextResponse.json(
          { error: "trustStatus must be pending, verified, or suspended" },
          { status: 400 },
        );
      }
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(siteRegistrations)
    .set(updates)
    .where(eq(siteRegistrations.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
