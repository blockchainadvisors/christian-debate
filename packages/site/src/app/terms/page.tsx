import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 6, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using Christians Debate (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree, do not
            use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Description of Service</h2>
          <p className="mt-2">
            Christians Debate is a structured discussion platform for theological
            debates. Users can create debates, post comments, declare stances,
            vote on arguments, and participate in community verdicts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Account Registration</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              You may sign in using Google or GitHub OAuth. You are responsible
              for the security of your connected accounts.
            </li>
            <li>
              You must provide accurate information and keep your account details
              current.
            </li>
            <li>
              You are responsible for all activity that occurs under your account.
            </li>
            <li>You must be at least 13 years of age to use the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. User Conduct</h2>
          <p className="mt-2">You agree to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Engage in good-faith discussion — argue honestly, represent
              opposing views fairly, and cite sources when making factual claims
            </li>
            <li>
              Respect other participants — personal attacks, harassment, and hate
              speech are prohibited
            </li>
            <li>
              Declare your stance honestly — misrepresenting your position to
              manipulate verdicts or analytics undermines the platform
            </li>
            <li>
              Not engage in vote manipulation, sockpuppeting, or coordinated
              inauthentic behavior
            </li>
            <li>
              Not post spam, malware, or content that violates applicable law
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Content Ownership and License</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              You retain ownership of the content you post. By submitting content
              to the Service, you grant us a non-exclusive, worldwide,
              royalty-free license to display, distribute, and reproduce your
              content in connection with operating the platform.
            </li>
            <li>
              You may delete your content at any time. Deletion removes the
              content from active display but cached or quoted references may
              persist.
            </li>
            <li>
              You represent that you have the right to post any content you
              submit and that it does not infringe on the rights of others.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Trust Tiers and Moderation</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              The platform uses a trust tier system (new, established, trusted,
              moderator, admin) that affects voting weight and platform
              privileges. Tiers are assigned based on account age, participation
              quality, and community standing.
            </li>
            <li>
              Comments may be quarantined (collapsed, not deleted) based on
              community flags or automated detection. Quarantined comments can be
              appealed.
            </li>
            <li>
              We reserve the right to remove content, suspend accounts, or take
              other action to maintain platform integrity.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Algorithmic Stance Detection</h2>
          <p className="mt-2">
            The platform may algorithmically analyze your participation patterns
            to detect potential stance misrepresentation. This is used
            transparently (visible indicators) and is non-punitive — it does not
            affect your ability to participate but may be displayed alongside
            your contributions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Verdict System</h2>
          <p className="mt-2">
            Verdicts are determined by neutral participants. The platform
            verifies neutrality through stance declarations and algorithmic
            analysis. Attempting to game the verdict system through dishonest
            stance declarations is a violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Federation (Optional)</h2>
          <p className="mt-2">
            If you opt into the Agora Network, aggregated reputation data may be
            shared across participating sites. You control the visibility of your
            cross-site profile. Federation is entirely opt-in and can be
            disconnected at any time from your Settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Disclaimers</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              The Service is provided &quot;as is&quot; without warranties of any kind,
              express or implied.
            </li>
            <li>
              We do not endorse any theological position expressed on the
              platform. All views are those of individual users.
            </li>
            <li>
              We are not responsible for the accuracy, completeness, or
              reliability of user-submitted content.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, Christians Debate and its
            operators shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising out of your use of the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Termination</h2>
          <p className="mt-2">
            We may suspend or terminate your access to the Service at any time
            for violations of these Terms or for any other reason at our
            discretion. You may delete your account at any time from your
            Settings page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">13. Changes to Terms</h2>
          <p className="mt-2">
            We may modify these Terms at any time. Material changes will be
            communicated via the platform. Continued use of the Service after
            changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">14. Contact</h2>
          <p className="mt-2">
            For questions about these Terms, contact us at{" "}
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
