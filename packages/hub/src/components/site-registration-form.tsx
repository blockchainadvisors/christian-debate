"use client";

import { useState } from "react";

interface Credentials {
  clientId: string;
  clientSecret: string;
  apiKey: string;
}

export function SiteRegistrationForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, niche, adminEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register site");
      }

      const data = await res.json();
      setCredentials({
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        apiKey: data.apiKey,
      });
      setName("");
      setBaseUrl("");
      setNiche("");
      setAdminEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (credentials) {
    return (
      <div
        style={{
          border: "2px solid #d97706",
          borderRadius: 8,
          padding: 24,
          background: "#fffbeb",
          marginTop: 16,
        }}
      >
        <h3 style={{ margin: "0 0 8px", color: "#92400e" }}>
          Save These Credentials Now
        </h3>
        <p style={{ color: "#92400e", fontSize: 14 }}>
          These will NOT be shown again. Copy them to a safe place.
        </p>
        <div style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 2 }}>
          <div>
            <strong>Client ID:</strong> {credentials.clientId}
          </div>
          <div>
            <strong>Client Secret:</strong> {credentials.clientSecret}
          </div>
          <div>
            <strong>API Key:</strong> {credentials.apiKey}
          </div>
        </div>
        <button
          onClick={() => {
            setCredentials(null);
            onSuccess?.();
          }}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          I have saved these credentials
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Site Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Base URL *
        </label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          required
          placeholder="https://example.com"
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Niche / Description
        </label>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. Reformed theology discussion"
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Admin Email
        </label>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "8px 20px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Registering..." : "Register Site"}
      </button>
    </form>
  );
}
