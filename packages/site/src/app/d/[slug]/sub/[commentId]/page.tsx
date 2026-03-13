import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { promotedComments, comments, users, debates } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubDebateComments } from "./sub-debate-comments";

const STANCE_COLORS: Record<string, string> = {
  side_a: "bg-blue-100 text-blue-800 border-blue-200",
  side_b: "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
  meta: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

function getStanceLabel(side: string, sideALabel: string, sideBLabel: string): string {
  switch (side) {
    case "side_a": return sideALabel;
    case "side_b": return sideBLabel;
    case "neutral": return "Neutral";
    case "meta": return "Meta";
    default: return side;
  }
}

interface CommentData {
  id: string;
  content: string;
  stanceSide: string;
  score: number;
  createdAt: string;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  authorId: string;
  parentId: string | null;
  status: string;
}

function CommentPreview({
  comment,
  sideALabel,
  sideBLabel,
}: {
  comment: CommentData;
  sideALabel: string;
  sideBLabel: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          {comment.authorAvatarUrl ? (
            <img
              src={comment.authorAvatarUrl}
              alt={comment.authorDisplayName}
              className="w-6 h-6 rounded-full shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
              {comment.authorDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium truncate shrink min-w-0">{comment.authorDisplayName}</span>
          <Badge
            variant="outline"
            className={`text-xs px-1.5 py-0 max-w-[200px] truncate shrink min-w-0 text-left ${STANCE_COLORS[comment.stanceSide] ?? ""}`}
            title={getStanceLabel(comment.stanceSide, sideALabel, sideBLabel)}
          >
            {getStanceLabel(comment.stanceSide, sideALabel, sideBLabel)}
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            Score: {comment.score}
          </span>
        </div>
        <div
          className="text-sm prose prose-sm max-w-none break-words overflow-hidden"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      </CardContent>
    </Card>
  );
}

export default async function SubDebatePage({
  params,
}: {
  params: Promise<{ slug: string; commentId: string }>;
}) {
  const { slug, commentId } = await params;

  // Find debate
  const [debate] = await db
    .select({
      id: debates.id,
      slug: debates.slug,
      title: debates.title,
      sideALabel: debates.sideALabel,
      sideBLabel: debates.sideBLabel,
      status: debates.status,
    })
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1);

  if (!debate) notFound();

  // Check promotion
  const [promoted] = await db
    .select()
    .from(promotedComments)
    .where(
      and(
        eq(promotedComments.commentId, commentId),
        eq(promotedComments.debateId, debate.id)
      )
    )
    .limit(1);

  if (!promoted) notFound();

  // Fetch thesis
  const [thesis] = await db
    .select({
      id: comments.id,
      content: comments.content,
      stanceSide: comments.stanceSide,
      score: comments.score,
      createdAt: comments.createdAt,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      authorId: comments.authorId,
      parentId: comments.parentId,
      status: comments.status,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!thesis) notFound();

  // Fetch descendants
  const descendants = await db
    .select({
      id: comments.id,
      content: comments.content,
      stanceSide: comments.stanceSide,
      score: comments.score,
      createdAt: comments.createdAt,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      authorId: comments.authorId,
      parentId: comments.parentId,
      status: comments.status,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(
      and(
        eq(comments.debateId, debate.id),
        sql`${commentId} = ANY(${comments.ancestorPath})`
      )
    )
    .orderBy(comments.createdAt);

  const active = descendants
    .filter((d) => d.status === "active")
    .map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }));

  const thesisStance = thesis.stanceSide;

  const supporting = active.filter((d) => d.stanceSide === thesisStance);
  const refuting = active.filter(
    (d) =>
      (thesisStance === "side_a" && d.stanceSide === "side_b") ||
      (thesisStance === "side_b" && d.stanceSide === "side_a")
  );
  const neutral = active.filter(
    (d) => d.stanceSide !== thesisStance &&
      !(
        (thesisStance === "side_a" && d.stanceSide === "side_b") ||
        (thesisStance === "side_b" && d.stanceSide === "side_a")
      )
  );

  const supportLabel = thesisStance === "side_a" ? debate.sideALabel : thesisStance === "side_b" ? debate.sideBLabel : "Supporting";
  const refuteLabel = thesisStance === "side_a" ? debate.sideBLabel : thesisStance === "side_b" ? debate.sideALabel : "Refuting";

  const isOpen = debate.status === "open";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 overflow-hidden">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground min-w-0">
        <Link href={`/d/${slug}`} className="hover:underline truncate inline-block max-w-[60vw] align-bottom">
          {debate.title}
        </Link>
        <span className="mx-2">/</span>
        <span>Sub-Debate</span>
      </nav>

      {/* Thesis */}
      <Card className="mb-8 border-2 border-primary/30 overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2 mb-3 min-w-0">
            <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 shrink-0">
              Thesis
            </Badge>
            {thesis.authorAvatarUrl ? (
              <img
                src={thesis.authorAvatarUrl}
                alt={thesis.authorDisplayName}
                className="w-8 h-8 rounded-full shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                {thesis.authorDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <Link href={`/u/${thesis.authorUsername}`} className="font-medium hover:underline truncate min-w-0">
              {thesis.authorDisplayName}
            </Link>
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0 max-w-[300px] truncate shrink min-w-0 text-left ${STANCE_COLORS[thesis.stanceSide] ?? ""}`}
              title={getStanceLabel(thesis.stanceSide, debate.sideALabel, debate.sideBLabel)}
            >
              {getStanceLabel(thesis.stanceSide, debate.sideALabel, debate.sideBLabel)}
            </Badge>
          </div>
          <div
            className="text-base prose max-w-none break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: thesis.content }}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Score: {thesis.score} · Promoted with {promoted.directReplyCount} {promoted.directReplyCount === 1 ? "reply" : "replies"}
          </p>
        </CardContent>
      </Card>

      {/* Comment editor for adding arguments */}
      {isOpen && (
        <SubDebateComments
          debateId={debate.id}
          debateSlug={debate.slug}
          sideALabel={debate.sideALabel}
          sideBLabel={debate.sideBLabel}
          thesisCommentId={commentId}
        />
      )}

      {/* Sides layout — Desktop: two columns */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-6">
        <div className="min-w-0">
          <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-950">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {supportLabel}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {supporting.length} argument{supporting.length !== 1 ? "s" : ""}
            </p>
          </div>
          {supporting.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No supporting arguments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {supporting.map((c) => (
                <CommentPreview key={c.id} comment={c} sideALabel={debate.sideALabel} sideBLabel={debate.sideBLabel} />
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 dark:bg-red-950">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              {refuteLabel}
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400">
              {refuting.length} argument{refuting.length !== 1 ? "s" : ""}
            </p>
          </div>
          {refuting.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No refuting arguments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {refuting.map((c) => (
                <CommentPreview key={c.id} comment={c} sideALabel={debate.sideALabel} sideBLabel={debate.sideBLabel} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold">{supportLabel} ({supporting.length})</h3>
          {supporting.length === 0 ? (
            <p className="text-sm text-muted-foreground">No supporting arguments yet.</p>
          ) : (
            <div className="space-y-3">
              {supporting.map((c) => (
                <CommentPreview key={c.id} comment={c} sideALabel={debate.sideALabel} sideBLabel={debate.sideBLabel} />
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">{refuteLabel} ({refuting.length})</h3>
          {refuting.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refuting arguments yet.</p>
          ) : (
            <div className="space-y-3">
              {refuting.map((c) => (
                <CommentPreview key={c.id} comment={c} sideALabel={debate.sideALabel} sideBLabel={debate.sideBLabel} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Neutral */}
      {neutral.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Neutral / Meta ({neutral.length})
          </h3>
          <div className="space-y-3">
            {neutral.map((c) => (
              <CommentPreview key={c.id} comment={c} sideALabel={debate.sideALabel} sideBLabel={debate.sideBLabel} />
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link
          href={`/d/${slug}?view=thread&highlight=${commentId}`}
          className="text-sm text-primary hover:underline"
        >
          View in original thread
        </Link>
      </div>
    </main>
  );
}
