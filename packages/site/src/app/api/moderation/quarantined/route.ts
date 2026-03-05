import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { comments, users, debates } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check moderator/admin
  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || (user.trustTier !== "moderator" && user.trustTier !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quarantined = await db
    .select({
      id: comments.id,
      content: comments.content,
      quarantineReason: comments.quarantineReason,
      status: comments.status,
      createdAt: comments.createdAt,
      debateId: comments.debateId,
      debateTitle: debates.title,
      debateSlug: debates.slug,
      authorId: users.id,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .innerJoin(debates, eq(comments.debateId, debates.id))
    .where(eq(comments.isQuarantined, true))
    .orderBy(desc(comments.createdAt));

  return NextResponse.json({ comments: quarantined });
}
