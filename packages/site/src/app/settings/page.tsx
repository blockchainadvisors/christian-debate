import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const trustTierStyles: Record<string, { badge: string; dot: string }> = {
  new: {
    badge: "border-muted-foreground/30 text-muted-foreground bg-muted/50",
    dot: "bg-muted-foreground/40",
  },
  established: {
    badge: "border-blue-500/30 text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40",
    dot: "bg-blue-500",
  },
  trusted: {
    badge: "border-emerald-500/30 text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40",
    dot: "bg-emerald-500",
  },
  moderator: {
    badge: "border-violet-500/30 text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/40",
    dot: "bg-violet-500",
  },
  admin: {
    badge: "border-amber-500/30 text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40",
    dot: "bg-amber-500",
  },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id as string))
    .limit(1);

  if (!user) redirect("/login");

  const tier = trustTierStyles[user.trustTier] ?? trustTierStyles.new;
  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Accent strip */}
        <div className="h-1 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20" />

        <div className="p-6 sm:p-8">
          {/* Avatar + identity */}
          <div className="flex items-start gap-5">
            {/* Avatar with decorative ring */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full border border-dashed border-primary/20" />
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="relative h-18 w-18 rounded-full object-cover ring-2 ring-background"
                />
              ) : (
                <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-primary/8 text-xl font-bold tracking-wide text-primary ring-2 ring-background">
                  {initials}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {user.displayName}
                </h2>
                <Badge
                  variant="outline"
                  className={tier.badge}
                >
                  <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${tier.dot}`} />
                  {user.trustTier}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                @{user.username}
              </p>
              {user.email && (
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {user.reputationScore}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Reputation
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {user.persuasionRating}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Minds Changed
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/u/${user.username}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12l4-4-4-4" />
              </svg>
              View Public Profile
            </Link>
          </div>
        </div>
      </section>

      {/* Account info */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Account Details</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-muted-foreground">Username</span>
            <span className="text-sm font-medium text-foreground">@{user.username}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-muted-foreground">Trust Tier</span>
            <Badge variant="outline" className={tier.badge}>
              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${tier.dot}`} />
              {user.trustTier}
            </Badge>
          </div>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="text-sm font-medium text-foreground">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "Unknown"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
