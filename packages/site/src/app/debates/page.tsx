import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/db";
import { debates, users } from "@/db/schema";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { DebateCard } from "@/components/debate-card";
import { DebateSearch } from "@/components/debate-search";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; tag?: string }>;
}

export default async function DebatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { q, status, tag } = params;

  const conditions = [];

  if (status && ["open", "locked", "archived"].includes(status)) {
    conditions.push(eq(debates.status, status as "open" | "locked" | "archived"));
  }

  if (tag) {
    conditions.push(sql`${tag} = ANY(${debates.tags})`);
  }

  if (q && q.trim()) {
    conditions.push(ilike(debates.title, `%${q.trim()}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allDebates = await db
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

  return (
    <div className="debates-page mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debates</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and join theological discussions
          </p>
        </div>
        <Button asChild>
          <Link href="/debates/new">New Debate</Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <DebateSearch />
      </Suspense>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allDebates.map((debate) => (
          <DebateCard key={debate.id} debate={debate} />
        ))}
      </div>

      {allDebates.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">
          <p className="text-lg">No debates found</p>
          <p className="mt-1 text-sm">Try adjusting your filters or start a new debate.</p>
        </div>
      )}
    </div>
  );
}
