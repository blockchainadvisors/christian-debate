import { notFound } from "next/navigation";
import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  comments,
  debates,
  debateStances,
  promotedComments,
} from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const trustTierColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-800",
  established: "bg-blue-100 text-blue-800",
  trusted: "bg-green-100 text-green-800",
  moderator: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
};

function UserAvatar({
  avatarUrl,
  displayName,
  size = "lg",
}: {
  avatarUrl: string | null;
  displayName: string;
  size?: "sm" | "lg";
}) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeClasses} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}
    >
      {initials}
    </div>
  );
}

const stanceSideLabels: Record<string, string> = {
  side_a: "Side A",
  side_b: "Side B",
  neutral: "Neutral",
  meta: "Meta",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    notFound();
  }

  // Fetch stats
  const [commentCountResult] = await db
    .select({ value: count() })
    .from(comments)
    .where(eq(comments.authorId, user.id));

  const debateCountResult = await db
    .selectDistinct({ debateId: debateStances.debateId })
    .from(debateStances)
    .where(eq(debateStances.userId, user.id));

  const [promotedCountResult] = await db
    .select({ value: count() })
    .from(promotedComments)
    .where(eq(promotedComments.authorId, user.id));

  const promotedDebates = promotedCountResult?.value ?? 0;

  const totalComments = commentCountResult?.value ?? 0;
  const debatesParticipated = debateCountResult.length;

  // Fetch recent comments with debate info
  const recentComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      score: comments.score,
      stanceSide: comments.stanceSide,
      createdAt: comments.createdAt,
      debateTitle: debates.title,
      debateSlug: debates.slug,
    })
    .from(comments)
    .innerJoin(debates, eq(comments.debateId, debates.id))
    .where(eq(comments.authorId, user.id))
    .orderBy(desc(comments.createdAt))
    .limit(10);

  // Fetch stance history
  const stances = await db
    .select({
      declaredStance: debateStances.declaredStance,
      declaredAt: debateStances.declaredAt,
      debateTitle: debates.title,
      debateSlug: debates.slug,
    })
    .from(debateStances)
    .innerJoin(debates, eq(debateStances.debateId, debates.id))
    .where(eq(debateStances.userId, user.id))
    .orderBy(desc(debateStances.declaredAt));

  const memberSince = user.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-2">
          <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <Badge
                className={trustTierColors[user.trustTier] ?? ""}
                variant="outline"
              >
                {user.trustTier}
              </Badge>
              {promotedDebates > 0 && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 border-amber-300 text-amber-700"
                >
                  {promotedDebates} Promoted
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {memberSince}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Reputation", value: user.reputationScore },
          { label: "Minds Changed", value: user.persuasionRating },
          { label: "Comments", value: totalComments },
          { label: "Debates", value: debatesParticipated },
          { label: "Promoted Debates", value: promotedDebates },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {recentComments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <a
                      href={`/d/${comment.debateSlug}`}
                      className="font-medium hover:underline"
                    >
                      {comment.debateTitle}
                    </a>
                    <Badge variant="outline" className="text-xs">
                      {stanceSideLabels[comment.stanceSide] ?? comment.stanceSide}
                    </Badge>
                    <span className="ml-auto text-muted-foreground">
                      Score: {comment.score}
                    </span>
                  </div>
                  <div
                    className="mt-1 text-sm text-foreground/80 line-clamp-2 [&>p]:inline"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comment.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stance History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Stance History</CardTitle>
        </CardHeader>
        <CardContent>
          {stances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stances declared yet.
            </p>
          ) : (
            <div className="space-y-3">
              {stances.map((stance, i) => (
                <div key={i} className="flex items-center justify-between">
                  <a
                    href={`/d/${stance.debateSlug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {stance.debateTitle}
                  </a>
                  <Badge variant="outline">
                    {stanceSideLabels[stance.declaredStance] ??
                      stance.declaredStance}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
