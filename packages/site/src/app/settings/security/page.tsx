import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { mfaSecrets } from "@/db/schema";
import { MfaSetup } from "@/components/auth/mfa-setup";
import { AgoraNetworkSection } from "@/components/settings/agora-network-section";

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
    <div className="space-y-6">
      {/* MFA Section */}
      <MfaSetup mfaEnabled={hasMfa} />

      {/* Agora Network */}
      {process.env.AGORA_HUB_URL && <AgoraNetworkSection />}

      {/* Password section hint */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Password</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground">
            If you signed up with email and password, you can reset your password from the login page
            using the &ldquo;Forgot password&rdquo; option.
          </p>
        </div>
      </section>
    </div>
  );
}
