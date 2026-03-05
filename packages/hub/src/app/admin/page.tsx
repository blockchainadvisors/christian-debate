export const dynamic = "force-dynamic";

import { db } from "@/db";
import {
  siteRegistrations,
  hubUsers,
  profileLinks,
  reputationSnapshots,
} from "@/db/schema";
import { eq, count, max, sql } from "drizzle-orm";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const adminToken = process.env.HUB_ADMIN_TOKEN;

  if (!adminToken) {
    return (
      <>
        <h1>Admin Dashboard</h1>
        <p style={{ color: "red" }}>HUB_ADMIN_TOKEN is not configured.</p>
      </>
    );
  }

  // Fetch sites
  const sites = await db.select().from(siteRegistrations);

  // Compute site status counts
  const verifiedCount = sites.filter((s) => s.trustStatus === "verified").length;
  const pendingCount = sites.filter((s) => s.trustStatus === "pending").length;
  const suspendedCount = sites.filter((s) => s.trustStatus === "suspended").length;

  // Total linked users (profileLinks)
  const [linkCountResult] = await db
    .select({ total: count() })
    .from(profileLinks);
  const totalLinkedUsers = linkCountResult?.total ?? 0;

  // Total hub users
  const [userCountResult] = await db
    .select({ total: count() })
    .from(hubUsers);
  const totalHubUsers = userCountResult?.total ?? 0;

  // Last sync timestamps per site (most recent reputationSnapshot)
  const lastSyncs = await db
    .select({
      siteId: reputationSnapshots.siteId,
      lastSync: max(reputationSnapshots.snapshotAt),
    })
    .from(reputationSnapshots)
    .groupBy(reputationSnapshots.siteId);

  const lastSyncMap: Record<string, string> = {};
  for (const row of lastSyncs) {
    if (row.lastSync) {
      lastSyncMap[row.siteId] = new Date(row.lastSync).toISOString();
    }
  }

  const statCardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "20px 24px",
    background: "#fff",
    minWidth: 160,
  };

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Network health overview and site management.
      </p>

      {/* Network Health Overview */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Network Overview</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{sites.length}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Total Registered Sites
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {verifiedCount} verified / {pendingCount} pending /{" "}
              {suspendedCount} suspended
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{totalHubUsers}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Hub Users</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {totalLinkedUsers}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Total Profile Links
            </div>
          </div>
        </div>
      </section>

      {/* Last Sync per Site */}
      {sites.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            Last Sync Timestamps
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
                <th style={{ padding: "8px 12px" }}>Site</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Last Sync</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr
                  key={site.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                    {site.name}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          site.trustStatus === "verified"
                            ? "#dcfce7"
                            : site.trustStatus === "pending"
                              ? "#fef9c3"
                              : "#fee2e2",
                        color:
                          site.trustStatus === "verified"
                            ? "#166534"
                            : site.trustStatus === "pending"
                              ? "#854d0e"
                              : "#991b1b",
                      }}
                    >
                      {site.trustStatus}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                    {lastSyncMap[site.id] ?? "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Site Registration Management */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          Site Registration Management
        </h2>
        <AdminDashboard initialSites={sites} adminToken={adminToken} />
      </section>
    </>
  );
}
