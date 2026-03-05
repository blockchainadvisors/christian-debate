"use client";

import { useState } from "react";
import type { SiteRegistration } from "@/db/schema";
import { SiteTable } from "@/components/site-table";
import { SiteRegistrationForm } from "@/components/site-registration-form";

export function AdminDashboard({
  initialSites,
  adminToken,
}: {
  initialSites: SiteRegistration[];
  adminToken: string;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "8px 20px",
            cursor: "pointer",
            fontWeight: 600,
            background: showForm ? "#e5e7eb" : "#2563eb",
            color: showForm ? "#374151" : "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          {showForm ? "Cancel" : "Register New Site"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Register a New Site</h2>
          <SiteRegistrationForm
            onSuccess={() => {
              setShowForm(false);
              // Reload to get updated list from server
              window.location.reload();
            }}
          />
        </div>
      )}

      <h2>Registered Sites</h2>
      <SiteTable initialSites={initialSites} adminToken={adminToken} />
    </>
  );
}
