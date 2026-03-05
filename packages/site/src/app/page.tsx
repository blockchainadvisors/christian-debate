import Link from "next/link";
import { db } from "@/db";
import { debates, users, comments } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { DebateCard } from "@/components/debate-card";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { StatsSection } from "@/components/landing/stats-section";
import { CtaSection } from "@/components/landing/cta-section";

export default async function Home() {
  const trending = await db
    .select({
      id: debates.id,
      title: debates.title,
      slug: debates.slug,
      description: debates.description,
      createdBy: debates.createdBy,
      sideALabel: debates.sideALabel,
      sideBLabel: debates.sideBLabel,
      status: debates.status,
      tags: debates.tags,
      createdAt: debates.createdAt,
      updatedAt: debates.updatedAt,
      creatorName: users.displayName,
      creatorUsername: users.username,
    })
    .from(debates)
    .leftJoin(users, eq(debates.createdBy, users.id))
    .where(eq(debates.status, "open"))
    .orderBy(desc(debates.createdAt))
    .limit(6);

  const [debateCount] = await db.select({ count: count() }).from(debates);
  const [commentCount] = await db.select({ count: count() }).from(comments);
  const [userCount] = await db.select({ count: count() }).from(users);

  return (
    <div className="landing-page">
      <HeroSection />

      <FeaturesSection />

      <div className="landing-divider" aria-hidden="true" />

      <HowItWorksSection />

      <div className="landing-divider" aria-hidden="true" />

      <StatsSection
        stats={{
          debates: debateCount?.count ?? 0,
          comments: commentCount?.count ?? 0,
          users: userCount?.count ?? 0,
        }}
      />

      <div className="landing-divider" aria-hidden="true" />

      {/* Trending Debates */}
      {trending.length > 0 && (
        <section className="landing-trending">
          <div className="landing-section-inner">
            <div className="landing-trending-header">
              <div>
                <p className="landing-section-label">Live Now</p>
                <h2 className="landing-section-title">Trending Debates</h2>
              </div>
              <Link href="/debates" className="landing-view-all">
                View all
              </Link>
            </div>
            <div className="landing-debates-grid">
              {trending.map((debate) => (
                <DebateCard key={debate.id} debate={debate} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaSection />

      <footer className="landing-footer">
        <div className="landing-section-inner">
          <p>Christian Debate Platform. Iron sharpens iron.</p>
        </div>
      </footer>
    </div>
  );
}
