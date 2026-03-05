interface StatsSectionProps {
  stats: {
    debates: number;
    comments: number;
    users: number;
  };
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="landing-stats">
      <div className="landing-section-inner">
        <div className="landing-stats-grid">
          <div className="landing-stat">
            <div className="landing-stat-num">{stats.debates}</div>
            <div className="landing-stat-label">Active Debates</div>
          </div>
          <div className="landing-stat-divider" aria-hidden="true" />
          <div className="landing-stat">
            <div className="landing-stat-num">{stats.comments.toLocaleString()}</div>
            <div className="landing-stat-label">Arguments Made</div>
          </div>
          <div className="landing-stat-divider" aria-hidden="true" />
          <div className="landing-stat">
            <div className="landing-stat-num">{stats.users}</div>
            <div className="landing-stat-label">Participants</div>
          </div>
        </div>
      </div>
    </section>
  );
}
