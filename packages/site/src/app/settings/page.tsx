import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, mfaSecrets } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AgoraNetworkSection } from "@/components/settings/agora-network-section";
import { MfaSetup } from "@/components/auth/mfa-setup";
import { and } from "drizzle-orm";

const trustTierColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-800",
  established: "bg-blue-100 text-blue-800",
  trusted: "bg-green-100 text-green-800",
  moderator: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id as string))
    .limit(1);

  const [mfa] = await db
    .select({ id: mfaSecrets.id })
    .from(mfaSecrets)
    .where(
      and(
        eq(mfaSecrets.userId, session.user.id as string),
        eq(mfaSecrets.verified, true)
      )
    )
    .limit(1);

  const hasMfa = !!mfa;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-foreground/60">
        Signed in as {session.user.email}
      </p>

      {user && (
        <>
          {/* Profile Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {user.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {user.displayName}
                    </span>
                    <Badge
                      className={trustTierColors[user.trustTier] ?? ""}
                      variant="outline"
                    >
                      {user.trustTier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <Link
                href={`/u/${user.username}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                View your public profile
              </Link>
            </CardContent>
          </Card>

          {/* MFA */}
          <MfaSetup mfaEnabled={hasMfa} />

          {/* Agora Network */}
          {process.env.AGORA_HUB_URL && <AgoraNetworkSection />}

          {/* Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{user.reputationScore}</p>
                  <p className="text-sm text-muted-foreground">
                    Reputation Score
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{user.persuasionRating}</p>
                  <p className="text-sm text-muted-foreground">
                    Minds Changed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
