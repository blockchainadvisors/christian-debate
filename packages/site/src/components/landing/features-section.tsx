const FEATURES = [
  {
    icon: "thread",
    title: "Threaded Discussions",
    description: "Nested comment trees with stance declarations, trust tiers, and reasoned voting. Every argument is attributed and scored.",
  },
  {
    icon: "sides",
    title: "Side-by-Side Views",
    description: "See both perspectives simultaneously. Comments separated by stance with clear visual distinction between positions.",
  },
  {
    icon: "exchange",
    title: "Best Exchanges",
    description: "AI-surfaced best exchanges between opposing sides. The strongest arguments meet their strongest rebuttals.",
  },
  {
    icon: "verdict",
    title: "Neutral Verdicts",
    description: "Only verified neutral observers can vote on the outcome. Bias is structurally minimized, not just discouraged.",
  },
  {
    icon: "analytics",
    title: "Debate Analytics",
    description: "Participation heatmaps, argument taxonomy, stance shift tracking, and engagement metrics — all in real time.",
  },
  {
    icon: "trust",
    title: "Trust & Reputation",
    description: "Tiered trust system based on argument quality, not popularity. Good-faith engagement is recognized and rewarded.",
  },
];

function FeatureIcon({ icon }: { icon: string }) {
  const paths: Record<string, string> = {
    thread: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    sides: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
    exchange: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
    verdict: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6V8m0 8h.01",
    analytics: "M18 20V10M12 20V4M6 20v-6",
    trust: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  };
  return (
    <div className="landing-feature-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[icon] || paths.thread} />
      </svg>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="landing-features">
      <div className="landing-section-inner">
        <p className="landing-section-label">Platform Features</p>
        <h2 className="landing-section-title">Built for Rigorous Discourse</h2>
        <p className="landing-section-desc">
          Every feature is designed to elevate the quality of debate, not just
          the volume of participation.
        </p>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="landing-feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <FeatureIcon icon={f.icon} />
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
