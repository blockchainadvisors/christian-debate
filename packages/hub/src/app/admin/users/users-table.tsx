"use client";

import { useState } from "react";

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  profileVisibility: "public" | "mutual_only" | "private";
  globalReputationScore: number;
  createdAt: Date;
  linkedSites: number;
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(userId: string) {
    if (confirmId !== userId) {
      setConfirmId(userId);
      return;
    }
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  const thStyle = {
    padding: "8px 12px",
    textAlign: "left" as const,
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
  };

  const tdStyle = {
    padding: "8px 12px",
    fontSize: 14,
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Visibility</th>
            <th style={thStyle}>Linked Sites</th>
            <th style={thStyle}>Reputation</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{ ...tdStyle, textAlign: "center", color: "#9ca3af" }}
              >
                No users found.
              </td>
            </tr>
          )}
          {users.map((user) => (
            <tr
              key={user.id}
              style={{ borderBottom: "1px solid #f3f4f6" }}
            >
              <td style={{ ...tdStyle, fontWeight: 500 }}>
                {user.displayName}
              </td>
              <td style={tdStyle}>{user.email}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      user.profileVisibility === "public"
                        ? "#dcfce7"
                        : user.profileVisibility === "mutual_only"
                          ? "#dbeafe"
                          : "#f3f4f6",
                    color:
                      user.profileVisibility === "public"
                        ? "#166534"
                        : user.profileVisibility === "mutual_only"
                          ? "#1e40af"
                          : "#374151",
                  }}
                >
                  {user.profileVisibility}
                </span>
              </td>
              <td style={tdStyle}>{user.linkedSites}</td>
              <td style={tdStyle}>{user.globalReputationScore}</td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={`/admin/users/${user.id}`}
                    style={{
                      padding: "4px 12px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      borderRadius: 4,
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    style={{
                      padding: "4px 12px",
                      background:
                        confirmId === user.id ? "#dc2626" : "#fee2e2",
                      color: confirmId === user.id ? "#fff" : "#991b1b",
                      border:
                        confirmId === user.id
                          ? "1px solid #dc2626"
                          : "1px solid #fecaca",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {deletingId === user.id
                      ? "Deleting..."
                      : confirmId === user.id
                        ? "Confirm Delete"
                        : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
