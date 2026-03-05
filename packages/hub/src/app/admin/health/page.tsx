export const dynamic = "force-dynamic";

import { db } from "@/db";
import {
  siteRegistrations,
  reputationSnapshots,
  profileLinks,
} from "@/db/schema";
import { eq, count, max } from "drizzle-orm";

const STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

export default async function HealthPage() {
  // Get all verified sites
  const verifiedSites = await db
    .select()
    .from(siteRegistrations)
    .where(eq(siteRegistrations.trustStatus, "verified"));

  // Last sync per site
  const lastSyncs = await db
    .select({
      siteId: reputationSnapshots.siteId,
      lastSync: max(reputationSnapshots.snapshotAt),
    })
    .from(reputationSnapshots)
    .groupBy(reputationSnapshots.siteId);

  const lastSyncMap: Record<string, Date | null> = {};
  for (const row of lastSyncs) {
    lastSyncMap[row.siteId] = row.lastSync ? new Date(row.lastSync) : null;
  }

  // Total syncs (total reputation snapshots)
  const [syncCountResult] = await db
    .select({ total: count() })
    .from(reputationSnapshots);
  const totalSyncs = syncCountResult?.total ?? 0;

  // Total active users (users with at least one profile link)
  const activeUsersResult = await db
    .selectDistinct({ hubUserId: profileLinks.hubUserId })
    .from(profileLinks);
  const totalActiveUsers = activeUsersResult.length;

  const now = new Date();

  const statCardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "20px 24px",
    background: "#fff",
    minWidth: 160,
  };

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Network Health</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Monitor site sync status and network-wide statistics.
      </p>

      {/* Network-wide stats */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Network Stats</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{totalSyncs}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Total Reputation Syncs
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {totalActiveUsers}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Total Active Users
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {verifiedSites.length}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Verified Sites
            </div>
          </div>
        </div>
      </section>

      {/* Per-site health */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          Verified Site Status
        </h2>
        {verifiedSites.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No verified sites yet.</p>
        ) : (
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
                <th style={{ padding: "8px 12px" }}>Site</th>
                <th style={{ padding: "8px 12px" }}>URL</th>
                <th style={{ padding: "8px 12px" }}>Last Reputation Sync</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {verifiedSites.map((site) => {
                const lastSync = lastSyncMap[site.id];
                const isStale =
                  !lastSync ||
                  now.getTime() - lastSync.getTime() > STALE_THRESHOLD_MS;

                return (
                  <tr
                    key={site.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                      {site.name}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <a
                        href={site.baseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#2563eb", textDecoration: "none" }}
                      >
                        {site.baseUrl}
                      </a>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                      {lastSync
                        ? lastSync.toISOString().replace("T", " ").slice(0, 19)
                        : "Never"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background: isStale ? "#fef3c7" : "#dcfce7",
                          color: isStale ? "#92400e" : "#166534",
                        }}
                      >
                        {isStale ? "STALE" : "OK"}
                      </span>
                      {isStale && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            color: "#92400e",
                          }}
                        >
                          {lastSync
                            ? `Last sync > 12h ago`
                            : "No sync recorded"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
