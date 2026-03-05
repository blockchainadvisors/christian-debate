import Link from "next/link";

export function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-hero-bg" aria-hidden="true" />
      <div className="landing-hero-ornament" aria-hidden="true" />
      <div className="landing-hero-content">
        <p className="landing-overline">A Platform for Meaningful Discourse</p>
        <h1 className="landing-title">Christian Debate</h1>
        <p className="landing-subtitle">
          Engage in thoughtful, structured debates on theology, doctrine, and
          faith. Explore opposing perspectives with civility and depth.
        </p>
        <div className="landing-cta-row">
          <Link href="/debates" className="landing-cta-primary">
            Browse Debates
          </Link>
          <Link href="/debates/new" className="landing-cta-secondary">
            Start a Debate
          </Link>
        </div>
      </div>
      <div className="landing-hero-scroll-hint" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>
    </section>
  );
}
