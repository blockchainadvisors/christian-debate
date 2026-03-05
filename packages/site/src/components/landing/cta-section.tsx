import Link from "next/link";

export function CtaSection() {
  return (
    <section className="landing-cta-section">
      <div className="landing-section-inner">
        <div className="landing-cta-card">
          <h2 className="landing-cta-title">Ready to Join the Conversation?</h2>
          <p className="landing-cta-desc">
            Explore active debates, declare your stance, and contribute
            meaningful arguments. Iron sharpens iron.
          </p>
          <div className="landing-cta-row">
            <Link href="/debates" className="landing-cta-primary">
              Explore Debates
            </Link>
            <Link href="/login" className="landing-cta-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
