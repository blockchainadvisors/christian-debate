import { notFound } from "next/navigation";
import { db } from "@/db";
import { debates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ViewSwitcher } from "@/components/view-switcher";
import { timeAgo } from "@/lib/time-ago";
import { ExpandableDescription } from "@/components/expandable-description";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DebateDetailPage({ params }: PageProps) {
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
    notFound();
  }

  const debate = results[0];

  function statusVariant(status: string) {
    switch (status) {
      case "open":
        return "default" as const;
      case "locked":
        return "secondary" as const;
      case "archived":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 overflow-hidden">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-3xl font-bold tracking-tight">
            {debate.title}
          </h1>
          <Badge variant={statusVariant(debate.status)} className="mt-1 capitalize shrink-0">
            {debate.status}
          </Badge>
        </div>

        {debate.description && (
          <ExpandableDescription text={debate.description} />
        )}

        {/* Sides */}
        <div className="debate-header-card flex flex-col items-center gap-3 rounded-lg border p-4 sm:flex-row sm:gap-4">
          <div className="min-w-0 flex-1 text-center">
            <div className="mb-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-500 debate-side-dot--a" />
            <p className="text-sm font-medium">Side A</p>
            <p className="text-sm font-semibold sm:text-base">{debate.sideALabel}</p>
          </div>
          <div className="text-xl font-bold text-muted-foreground/40">vs</div>
          <div className="min-w-0 flex-1 text-center">
            <div className="mb-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-500 debate-side-dot--b" />
            <p className="text-sm font-medium">Side B</p>
            <p className="text-sm font-semibold sm:text-base">{debate.sideBLabel}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            Started by{" "}
            <span className="font-medium text-foreground">
              {debate.creatorName || debate.creatorUsername || "Anonymous"}
            </span>
          </span>
          <span>&middot;</span>
          <span>{timeAgo(debate.createdAt)}</span>
          {debate.tags && debate.tags.length > 0 && (
            <>
              <span>&middot;</span>
              <div className="flex gap-1">
                {debate.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* View Switcher */}
      <ViewSwitcher debate={debate} />
    </div>
  );
}
