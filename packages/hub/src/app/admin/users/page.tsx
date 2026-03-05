export const dynamic = "force-dynamic";

import { db } from "@/db";
import { hubUsers, profileLinks } from "@/db/schema";
import { eq, count, ilike, or } from "drizzle-orm";
import { UsersTable } from "./users-table";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";

  // Fetch users with linked sites count
  let usersQuery = db
    .select({
      id: hubUsers.id,
      email: hubUsers.email,
      displayName: hubUsers.displayName,
      profileVisibility: hubUsers.profileVisibility,
      globalReputationScore: hubUsers.globalReputationScore,
      createdAt: hubUsers.createdAt,
      linkedSites: count(profileLinks.id),
    })
    .from(hubUsers)
    .leftJoin(profileLinks, eq(hubUsers.id, profileLinks.hubUserId))
    .groupBy(hubUsers.id);

  if (query) {
    usersQuery = usersQuery.where(
      or(
        ilike(hubUsers.email, `%${query}%`),
        ilike(hubUsers.displayName, `%${query}%`),
      ),
    ) as typeof usersQuery;
  }

  const users = await usersQuery;

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Users</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Manage hub user accounts.
      </p>

      {/* Search form */}
      <form
        method="GET"
        style={{ marginBottom: 24, display: "flex", gap: 8 }}
      >
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by email or name..."
          style={{
            padding: "8px 14px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            width: 320,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Search
        </button>
        {query && (
          <a
            href="/admin/users"
            style={{
              padding: "8px 16px",
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
            }}
          >
            Clear
          </a>
        )}
      </form>

      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
        Showing {users.length} user{users.length !== 1 ? "s" : ""}
        {query ? ` matching "${query}"` : ""}
      </p>

      <UsersTable users={users} />
    </>
  );
}
