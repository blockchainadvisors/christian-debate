const STEPS = [
  {
    num: "I",
    title: "Declare Your Stance",
    desc: "Choose a side or remain neutral. Your stance is visible — transparency drives accountability.",
  },
  {
    num: "II",
    title: "Make Your Case",
    desc: "Write thoughtful arguments with a rich text editor. Tag your reasoning, cite your sources.",
  },
  {
    num: "III",
    title: "Engage & Respond",
    desc: "Reply to opposing arguments directly. The best exchanges between sides are surfaced automatically.",
  },
  {
    num: "IV",
    title: "Reach a Verdict",
    desc: "Only neutral observers vote on outcomes. The community's judgment is earned, not manufactured.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="landing-how-it-works">
      <div className="landing-section-inner">
        <p className="landing-section-label">How It Works</p>
        <h2 className="landing-section-title">Four Steps to Meaningful Debate</h2>
        <div className="landing-steps">
          {STEPS.map((step, i) => (
            <div key={step.num} className="landing-step" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="landing-step-num">{step.num}</div>
              <div className="landing-step-connector" aria-hidden="true" />
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
