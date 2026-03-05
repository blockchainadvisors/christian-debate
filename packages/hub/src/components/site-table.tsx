"use client";

import { useState } from "react";
import type { SiteRegistration } from "@/db/schema";

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef3c7", color: "#92400e" },
  verified: { bg: "#d1fae5", color: "#065f46" },
  suspended: { bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] ?? { bg: "#e5e7eb", color: "#374151" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        background: colors.bg,
        color: colors.color,
      }}
    >
      {status}
    </span>
  );
}

export function SiteTable({
  initialSites,
  adminToken,
}: {
  initialSites: SiteRegistration[];
  adminToken: string;
}) {
  const [sites, setSites] = useState(initialSites);

  async function updateStatus(id: string, trustStatus: string) {
    const res = await fetch(`/api/sites/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ trustStatus }),
    });

    if (res.ok) {
      const updated = await res.json();
      setSites((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  }

  if (sites.length === 0) {
    return <p style={{ color: "#6b7280" }}>No sites registered yet.</p>;
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 14,
      }}
    >
      <thead>
        <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
          <th style={{ padding: "8px 12px" }}>Name</th>
          <th style={{ padding: "8px 12px" }}>Base URL</th>
          <th style={{ padding: "8px 12px" }}>Status</th>
          <th style={{ padding: "8px 12px" }}>Created</th>
          <th style={{ padding: "8px 12px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sites.map((site) => (
          <tr
            key={site.id}
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <td style={{ padding: "8px 12px", fontWeight: 500 }}>
              {site.name}
            </td>
            <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 13 }}>
              {site.baseUrl}
            </td>
            <td style={{ padding: "8px 12px" }}>
              <StatusBadge status={site.trustStatus} />
            </td>
            <td style={{ padding: "8px 12px" }}>
              {new Date(site.createdAt).toLocaleDateString()}
            </td>
            <td style={{ padding: "8px 12px" }}>
              {site.trustStatus !== "verified" && (
                <button
                  onClick={() => updateStatus(site.id, "verified")}
                  style={{
                    marginRight: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                    background: "#d1fae5",
                    border: "1px solid #065f46",
                    borderRadius: 4,
                    color: "#065f46",
                    fontSize: 12,
                  }}
                >
                  Verify
                </button>
              )}
              {site.trustStatus !== "suspended" && (
                <button
                  onClick={() => updateStatus(site.id, "suspended")}
                  style={{
                    padding: "4px 10px",
                    cursor: "pointer",
                    background: "#fee2e2",
                    border: "1px solid #991b1b",
                    borderRadius: 4,
                    color: "#991b1b",
                    fontSize: 12,
                  }}
                >
                  Suspend
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
