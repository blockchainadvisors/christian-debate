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

  const [fedRecord] = await db
    .select({ id: federatedIdentity.id })
    .from(federatedIdentity)
    .where(eq(federatedIdentity.localUserId, session.user.id as string))
    .limit(1);

  const isFederated = !!fedRecord;

  return (
    <div className="space-y-6">
      {/* Data collection info */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Data Collection &amp; Privacy</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            We collect only the data necessary to operate the debate platform. Here is what we store:
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                label: "Profile information",
                desc: "Username, display name, email, and avatar for account identification.",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
                  </svg>
                ),
              },
              {
                label: "Comments & votes",
                desc: "Your debate contributions and voting history. These never leave this site.",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h12v8H5l-3 3V3z" />
                  </svg>
                ),
              },
              {
                label: "Stances & stance shifts",
                desc: "Your declared positions in debates and any changes over time.",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 10 6 6 10 10 14 6" />
                  </svg>
                ),
              },
              {
                label: "Reputation scores",
                desc: "Computed from your activity to establish trust tiers.",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="8 1 10 6 15 6 11 9.5 12.5 14.5 8 11.5 3.5 14.5 5 9.5 1 6 6 6" />
                  </svg>
                ),
              },
              ...(isFederated
                ? [
                    {
                      label: "Agora Hub data",
                      desc: "Only aggregated reputation snapshots are shared with the Hub. Comment content and votes never leave this site.",
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="8" r="6.5" />
                          <path d="M1.5 8h13M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5" />
                        </svg>
                      ),
                    },
                  ]
                : []),
            ].map((item) => (
              <div key={item.label} className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Default privacy settings */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Default Privacy Settings</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Profile Visibility", value: PRIVACY_DEFAULTS.profileVisibility },
            {
              label: "Cross-Site Reputation",
              value: PRIVACY_DEFAULTS.crossSiteRepDisplay ? "Enabled" : "Disabled",
            },
            {
              label: "Comment Highlights Sharing",
              value: PRIVACY_DEFAULTS.commentHighlightsSharing ? "Enabled" : "Disabled",
            },
            {
              label: "Fingerprint Sharing",
              value: PRIVACY_DEFAULTS.fingerprintSharing ? "Enabled" : "Disabled",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy actions (download data, delete account) */}
      <PrivacySection isFederated={isFederated} />
    </div>
  );
}
