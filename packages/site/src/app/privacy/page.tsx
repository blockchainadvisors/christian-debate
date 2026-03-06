import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 6, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Introduction</h2>
          <p className="mt-2">
            Christians Debate (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the Christians Debate
            platform. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>
          <p className="mt-2">We collect the following types of information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Account Information:</strong> When you sign in via Google,
              Apple, Facebook, or Microsoft, we receive your name, email
              address, and profile picture from the provider. We do not receive
              or store your password.
            </li>
            <li>
              <strong>User Content:</strong> Debate comments, votes, stance
              declarations, and other content you submit to the platform.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, and
              general engagement patterns to improve the platform experience.
            </li>
            <li>
              <strong>Guest Data:</strong> If you interact with the platform
              before signing in, comments and votes are stored locally in your
              browser and submitted upon login.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>To create and manage your account</li>
            <li>To display your contributions (comments, votes, stances) within debates</li>
            <li>To compute trust tiers, reputation scores, and engagement analytics</li>
            <li>To detect and prevent abuse, spam, and bad-faith participation</li>
            <li>To improve the platform and develop new features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Public Information</h2>
          <p className="mt-2">
            Your display name, stance declarations, comments, votes, and
            reputation data are publicly visible on the platform. Your email
            address is never publicly displayed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Data Sharing</h2>
          <p className="mt-2">
            We do not sell your personal information. We may share data in the
            following circumstances:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>With your consent or at your direction</li>
            <li>
              <strong>Federation (opt-in):</strong> If you link your account to
              the Agora Network, aggregated reputation data may be shared with
              other sites in the network, subject to your visibility settings
            </li>
            <li>To comply with legal obligations or enforce our Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Data Storage and Security</h2>
          <p className="mt-2">
            Your data is stored on secured servers. We use industry-standard
            measures to protect your information, including encrypted connections
            (HTTPS), secure authentication via OAuth providers, and access
            controls on our database infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Cookies and Local Storage</h2>
          <p className="mt-2">
            We use session cookies for authentication and local storage for theme
            preferences and guest mode caching. We do not use third-party
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Your Rights</h2>
          <p className="mt-2">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for optional data processing (e.g., federation)</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, visit your account Settings page or contact
            us at the address below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Data Retention</h2>
          <p className="mt-2">
            We retain your account data for as long as your account is active.
            Upon account deletion, personal data is removed within 30 days.
            Anonymized content (comments, votes) may be retained for platform
            integrity.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We will notify
            users of material changes via the platform. Continued use of the
            service after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Contact</h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a
              href="mailto:contact@christiansdebate.com"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              contact@christiansdebate.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
