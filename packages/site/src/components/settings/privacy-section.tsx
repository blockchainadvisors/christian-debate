"use client";

import { useState, useCallback } from "react";

interface PrivacySectionProps {
  isFederated?: boolean;
}

export function PrivacySection({ isFederated }: PrivacySectionProps) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/privacy/export-data");
      if (!res.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] ?? "user-data-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download your data. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (confirmText !== "DELETE") return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/privacy/delete-account", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete account");
      }
      setDeleted(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  }, [confirmText]);

  if (deleted) {
    return (
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <polyline points="2 8 6 12 14 4" />
            </svg>
          </div>
          <p className="text-lg font-medium text-foreground">Your account has been deleted.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Redirecting you to the home page...
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Download data */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Export Your Data</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Download a complete copy of your data including profile, comments, votes, stances, and stance shifts.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8m0 0l-3-3m3 3l3-3" />
              <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
            </svg>
            {exporting ? "Preparing\u2026" : "Download Data (JSON)"}
          </button>
          {error && !showConfirm && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      </section>

      {/* Delete account */}
      <section className="overflow-hidden rounded-xl border border-destructive/20 bg-card shadow-sm">
        <div className="border-b border-destructive/20 px-6 py-4">
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-lg border border-destructive/15 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Permanently delete your account
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-destructive/80">
              <li>Your profile will be anonymized</li>
              <li>Your comments will be replaced with &quot;[deleted]&quot;</li>
              <li>All votes and stances will be permanently removed</li>
              <li>Sessions and linked accounts will be deleted</li>
            </ul>
            {isFederated && (
              <p className="mt-3 text-xs font-medium text-destructive">
                Deleting your account will cascade to all linked Agora sites within 72 hours.
              </p>
            )}
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-4 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
            >
              Delete My Account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Type <strong className="text-foreground">DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-destructive/30 bg-transparent px-3 py-2.5 text-sm focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleting ? "Deleting\u2026" : "Permanently Delete"}
                </button>
              </div>
            </div>
          )}

          {error && showConfirm && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      </section>
    </div>
  );
}
