"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      // Redirect to home after short delay
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
      <Card className="mt-4">
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium">Your account has been deleted.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirecting you to the home page...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Download Data */}
      <Card>
        <CardHeader>
          <CardTitle>Download My Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Download a copy of all data associated with your account, including
            your profile, comments, votes, stances, and stance shifts.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 w-full rounded-lg border border-foreground/20 px-4 py-3 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
          >
            {exporting ? "Preparing download..." : "Download My Data (JSON)"}
          </button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Delete My Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              This action is permanent and cannot be undone.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700 space-y-1">
              <li>Your profile will be anonymized</li>
              <li>Your comments will be replaced with &quot;[deleted]&quot;</li>
              <li>All your votes and stances will be permanently removed</li>
              <li>Your sessions and linked accounts will be deleted</li>
            </ul>
            {isFederated && (
              <p className="mt-3 text-sm font-medium text-red-800">
                Note: Deleting your Agora Hub account will cascade to all linked
                sites within 72 hours.
              </p>
            )}
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-4 w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete My Account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-foreground/70">
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
