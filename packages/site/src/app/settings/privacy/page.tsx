import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { federatedIdentity } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PrivacySection } from "@/components/settings/privacy-section";
import { PRIVACY_DEFAULTS } from "@/lib/privacy-defaults";

export default async function PrivacySettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Check if user has a federated identity
  const [fedRecord] = await db
    .select({ id: federatedIdentity.id })
    .from(federatedIdentity)
    .where(eq(federatedIdentity.localUserId, session.user.id as string))
    .limit(1);

  const isFederated = !!fedRecord;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Privacy Settings</h1>
      <p className="mt-2 text-foreground/60">
        Manage your data and privacy preferences.
      </p>

      {/* Privacy Defaults Info */}
      <section className="mt-6 rounded-lg border border-foreground/10 p-4">
        <h2 className="text-lg font-semibold">Data Collection &amp; Privacy</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We collect only the data necessary to provide the debate platform. Here
          is what we store and how we use it:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>Profile information</strong> &mdash; Your username, display
            name, email, and avatar for account identification.
          </li>
          <li>
            <strong>Comments &amp; votes</strong> &mdash; Your debate
            contributions and voting history. These never leave this site.
          </li>
          <li>
            <strong>Stances &amp; stance shifts</strong> &mdash; Your declared
            positions in debates and any changes over time.
          </li>
          <li>
            <strong>Reputation scores</strong> &mdash; Computed from your
            activity to establish trust tiers.
          </li>
          {isFederated && (
            <li>
              <strong>Agora Hub data</strong> &mdash; Only aggregated reputation
              snapshots are shared with the Hub. Comment content and votes never
              leave this site.
            </li>
          )}
        </ul>

        <h3 className="mt-4 text-sm font-semibold">Default Privacy Settings</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>
            Profile Visibility:{" "}
            <span className="font-medium">{PRIVACY_DEFAULTS.profileVisibility}</span>
          </li>
          <li>
            Cross-Site Reputation Display:{" "}
            <span className="font-medium">
              {PRIVACY_DEFAULTS.crossSiteRepDisplay ? "On" : "Off"}
            </span>
          </li>
          <li>
            Comment Highlights Sharing:{" "}
            <span className="font-medium">
              {PRIVACY_DEFAULTS.commentHighlightsSharing ? "On" : "Off"}
            </span>
          </li>
          <li>
            Fingerprint Sharing:{" "}
            <span className="font-medium">
              {PRIVACY_DEFAULTS.fingerprintSharing ? "On" : "Off"}
            </span>
          </li>
        </ul>
      </section>

      {/* Privacy Actions */}
      <div className="mt-6">
        <PrivacySection isFederated={isFederated} />
      </div>
    </main>
  );
}
