import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slugify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const results = await db
      .select({
        id: debates.id,
        title: debates.title,
        slug: debates.slug,
        description: debates.description,
        createdBy: debates.createdBy,
        sideALabel: debates.sideALabel,
        sideBLabel: debates.sideBLabel,
        status: debates.status,
        tags: debates.tags,
        createdAt: debates.createdAt,
        updatedAt: debates.updatedAt,
        creatorName: users.displayName,
        creatorUsername: users.username,
        creatorAvatar: users.avatarUrl,
      })
      .from(debates)
      .leftJoin(users, eq(debates.createdBy, users.id))
      .where(eq(debates.slug, slug))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error("Failed to fetch debate:", error);
    return NextResponse.json(
      { error: "Failed to fetch debate" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Fetch existing debate
    const [existing] = await db
      .select()
      .from(debates)
      .where(eq(debates.slug, slug))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    if (existing.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, sideALabel, sideBLabel, tags, status } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (title !== undefined) {
      if (typeof title !== "string" || title.length < 3 || title.length > 300) {
        return NextResponse.json(
          { error: "Title must be between 3 and 300 characters" },
          { status: 400 }
        );
      }
      updates.title = title.trim();
      updates.slug = await uniqueSlug(title);
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (sideALabel !== undefined) {
      if (typeof sideALabel !== "string" || sideALabel.length < 1 || sideALabel.length > 100) {
        return NextResponse.json(
          { error: "Side A label must be between 1 and 100 characters" },
          { status: 400 }
        );
      }
      updates.sideALabel = sideALabel.trim();
    }

    if (sideBLabel !== undefined) {
      if (typeof sideBLabel !== "string" || sideBLabel.length < 1 || sideBLabel.length > 100) {
        return NextResponse.json(
          { error: "Side B label must be between 1 and 100 characters" },
          { status: 400 }
        );
      }
      updates.sideBLabel = sideBLabel.trim();
    }

    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags.filter((t: unknown) => typeof t === "string" && (t as string).trim().length > 0).map((t: string) => t.trim())
        : null;
    }

    if (status !== undefined) {
      if (!["open", "locked", "archived"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    const [updated] = await db
      .update(debates)
      .set(updates)
      .where(eq(debates.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update debate:", error);
    return NextResponse.json(
      { error: "Failed to update debate" },
      { status: 500 }
    );
  }
}
