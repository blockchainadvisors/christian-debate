export const dynamic = "force-dynamic";

import { db } from "@/db";
import { hubUsers, profileLinks, siteRegistrations, reputationSnapshots } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [user] = await db
    .select()
    .from(hubUsers)
    .where(eq(hubUsers.id, id))
    .limit(1);

  if (!user) {
    notFound();
  }

  // Get linked sites
  const links = await db
    .select({
      siteId: profileLinks.siteId,
      localUserId: profileLinks.localUserId,
      visibility: profileLinks.visibility,
      linkedAt: profileLinks.linkedAt,
      siteName: siteRegistrations.name,
      siteUrl: siteRegistrations.baseUrl,
    })
    .from(profileLinks)
    .leftJoin(siteRegistrations, eq(profileLinks.siteId, siteRegistrations.id))
    .where(eq(profileLinks.hubUserId, id));

  // Get recent reputation snapshots
  const snapshots = await db
    .select({
      siteId: reputationSnapshots.siteId,
      reputationScore: reputationSnapshots.reputationScore,
      persuasionRating: reputationSnapshots.persuasionRating,
      commentCount: reputationSnapshots.commentCount,
      debateCount: reputationSnapshots.debateCount,
      snapshotAt: reputationSnapshots.snapshotAt,
      siteName: siteRegistrations.name,
    })
    .from(reputationSnapshots)
    .leftJoin(
      siteRegistrations,
      eq(reputationSnapshots.siteId, siteRegistrations.id),
    )
    .where(eq(reputationSnapshots.hubUserId, id))
    .orderBy(reputationSnapshots.snapshotAt)
    .limit(20);

  const labelStyle = {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  };
  const valueStyle = {
    fontSize: 15,
    fontWeight: 500 as const,
    marginBottom: 16,
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <a
          href="/admin/users"
          style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}
        >
          &larr; Back to Users
        </a>
      </div>

      <h1 style={{ marginTop: 0 }}>User: {user.displayName}</h1>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Profile Details</h2>
        <div style={labelStyle}>Email</div>
        <div style={valueStyle}>{user.email}</div>
        <div style={labelStyle}>Display Name</div>
        <div style={valueStyle}>{user.displayName}</div>
        <div style={labelStyle}>Profile Visibility</div>
        <div style={valueStyle}>{user.profileVisibility}</div>
        <div style={labelStyle}>Global Reputation Score</div>
        <div style={valueStyle}>{user.globalReputationScore}</div>
        <div style={labelStyle}>Created</div>
        <div style={valueStyle}>
          {new Date(user.createdAt).toLocaleString()}
        </div>
      </section>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16 }}>
          Linked Sites ({links.length})
        </h2>
        {links.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No linked sites.</p>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "6px 10px" }}>Site</th>
                <th style={{ padding: "6px 10px" }}>Local User ID</th>
                <th style={{ padding: "6px 10px" }}>Visibility</th>
                <th style={{ padding: "6px 10px" }}>Linked At</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.siteId}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: "6px 10px" }}>
                    {link.siteName ?? link.siteId}
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {link.localUserId}
                  </td>
                  <td style={{ padding: "6px 10px" }}>{link.visibility}</td>
                  <td style={{ padding: "6px 10px", color: "#6b7280" }}>
                    {new Date(link.linkedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {snapshots.length > 0 && (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 24,
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16 }}>
            Reputation Snapshots (Recent)
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e5e7eb",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "6px 10px" }}>Site</th>
                <th style={{ padding: "6px 10px" }}>Score</th>
                <th style={{ padding: "6px 10px" }}>Persuasion</th>
                <th style={{ padding: "6px 10px" }}>Comments</th>
                <th style={{ padding: "6px 10px" }}>Debates</th>
                <th style={{ padding: "6px 10px" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: "6px 10px" }}>
                    {snap.siteName ?? snap.siteId}
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    {snap.reputationScore}
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    {snap.persuasionRating}
                  </td>
                  <td style={{ padding: "6px 10px" }}>{snap.commentCount}</td>
                  <td style={{ padding: "6px 10px" }}>{snap.debateCount}</td>
                  <td style={{ padding: "6px 10px", color: "#6b7280" }}>
                    {new Date(snap.snapshotAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
