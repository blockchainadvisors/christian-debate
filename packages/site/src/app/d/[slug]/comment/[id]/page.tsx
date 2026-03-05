import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { debates, comments, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { AncestorTrail } from "@/components/comments/ancestor-trail";
import type { CommentWithAuthor } from "@/types/comments";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function CommentDeepLinkPage({ params }: PageProps) {
  const { slug, id } = await params;

  // Fetch debate info
  const debateResults = await db
    .select({
      id: debates.id,
      title: debates.title,
      slug: debates.slug,
      sideALabel: debates.sideALabel,
      sideBLabel: debates.sideBLabel,
      status: debates.status,
    })
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1);

  if (debateResults.length === 0) {
    notFound();
  }

  const debate = debateResults[0];

  // Fetch the target comment with author
  const targetResults = await db
    .select({
      id: comments.id,
      debateId: comments.debateId,
      authorId: comments.authorId,
      parentId: comments.parentId,
      rootId: comments.rootId,
      depth: comments.depth,
      content: comments.content,
      stanceSide: comments.stanceSide,
      ancestorPath: comments.ancestorPath,
      isQuarantined: comments.isQuarantined,
      quarantineReason: comments.quarantineReason,
      status: comments.status,
      score: comments.score,
      createdAt: comments.createdAt,
      editedAt: comments.editedAt,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.id, id))
    .limit(1);

  if (targetResults.length === 0) {
    notFound();
  }

  const target = targetResults[0];

  const formatComment = (row: typeof target): CommentWithAuthor => ({
    id: row.id,
    debateId: row.debateId,
    authorId: row.authorId,
    parentId: row.parentId,
    rootId: row.rootId,
    depth: row.depth,
    content: row.content,
    stanceSide: row.stanceSide,
    ancestorPath: row.ancestorPath,
    isQuarantined: row.isQuarantined,
    quarantineReason: row.quarantineReason,
    status: row.status,
    score: row.score,
    createdAt: row.createdAt?.toISOString() ?? "",
    editedAt: row.editedAt?.toISOString() ?? null,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName ?? "Unknown",
      username: row.authorUsername ?? "unknown",
      avatarUrl: row.authorAvatarUrl ?? null,
    },
  });

  // Fetch ancestors
  let ancestors: CommentWithAuthor[] = [];

  if (target.ancestorPath && target.ancestorPath.length > 0) {
    const ancestorResults = await db
      .select({
        id: comments.id,
        debateId: comments.debateId,
        authorId: comments.authorId,
        parentId: comments.parentId,
        rootId: comments.rootId,
        depth: comments.depth,
        content: comments.content,
        stanceSide: comments.stanceSide,
        ancestorPath: comments.ancestorPath,
        isQuarantined: comments.isQuarantined,
        quarantineReason: comments.quarantineReason,
        status: comments.status,
        score: comments.score,
        createdAt: comments.createdAt,
        editedAt: comments.editedAt,
        authorDisplayName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(inArray(comments.id, target.ancestorPath));

    // Sort by depth order (matching ancestorPath order)
    const ancestorMap = new Map(ancestorResults.map((a) => [a.id, a]));
    ancestors = target.ancestorPath
      .map((ancestorId) => ancestorMap.get(ancestorId))
      .filter((a): a is NonNullable<typeof a> => a != null)
      .map(formatComment);
  }

  const comment = formatComment(target);

  const STANCE_COLORS: Record<string, string> = {
    side_a: "bg-blue-100 text-blue-800 border-blue-200",
    side_b: "bg-red-100 text-red-800 border-red-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    meta: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  function getStanceLabel(side: string): string {
    switch (side) {
      case "side_a":
        return debate.sideALabel;
      case "side_b":
        return debate.sideBLabel;
      case "neutral":
        return "Neutral";
      case "meta":
        return "Meta";
      default:
        return side;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Debate title */}
      <div className="mb-4">
        <Link
          href={`/d/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to debate
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight">{debate.title}</h1>
      </div>

      {/* Ancestor Trail */}
      {ancestors.length > 0 && (
        <AncestorTrail
          ancestors={ancestors}
          sideALabel={debate.sideALabel}
          sideBLabel={debate.sideBLabel}
        />
      )}

      {/* Target Comment — highlighted */}
      <div className="mt-6 rounded-lg border-2 border-blue-400 ring-2 ring-blue-200 bg-blue-50/30 p-5">
        <div className="flex items-center gap-2 mb-2">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.displayName}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-600">
              {comment.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium">{comment.author.displayName}</span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STANCE_COLORS[comment.stanceSide] || ""}`}
          >
            {getStanceLabel(comment.stanceSide)}
          </span>
        </div>

        {comment.status === "deleted_by_author" || comment.status === "removed_by_mod" ? (
          <p className="text-sm italic text-gray-400">
            {comment.status === "deleted_by_author"
              ? "[Comment deleted by author]"
              : "[Comment removed by moderator]"}
          </p>
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        )}
      </div>

      {/* View full thread link */}
      <div className="mt-6 text-center">
        <Link
          href={`/d/${slug}`}
          className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          View full thread
        </Link>
      </div>
    </div>
  );
}
