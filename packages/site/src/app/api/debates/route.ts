import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debates, users } from "@/db/schema";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slugify";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");

    const conditions = [];

    if (status) {
      conditions.push(eq(debates.status, status as "open" | "locked" | "archived"));
    }

    if (tag) {
      conditions.push(sql`${tag} = ANY(${debates.tags})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      })
      .from(debates)
      .leftJoin(users, eq(debates.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(debates.createdAt));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch debates:", error);
    return NextResponse.json(
      { error: "Failed to fetch debates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, sideALabel, sideBLabel, tags } = body;

    // Validation
    if (!title || typeof title !== "string" || title.length < 3 || title.length > 300) {
      return NextResponse.json(
        { error: "Title must be between 3 and 300 characters" },
        { status: 400 }
      );
    }

    if (!sideALabel || typeof sideALabel !== "string" || sideALabel.length < 1 || sideALabel.length > 100) {
      return NextResponse.json(
        { error: "Side A label must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    if (!sideBLabel || typeof sideBLabel !== "string" || sideBLabel.length < 1 || sideBLabel.length > 100) {
      return NextResponse.json(
        { error: "Side B label must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(title);

    const parsedTags = Array.isArray(tags)
      ? tags.filter((t: unknown) => typeof t === "string" && t.trim().length > 0).map((t: string) => t.trim())
      : null;

    const [created] = await db
      .insert(debates)
      .values({
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        createdBy: session.user.id,
        sideALabel: sideALabel.trim(),
        sideBLabel: sideBLabel.trim(),
        tags: parsedTags,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create debate:", error);
    return NextResponse.json(
      { error: "Failed to create debate" },
      { status: 500 }
    );
  }
}
