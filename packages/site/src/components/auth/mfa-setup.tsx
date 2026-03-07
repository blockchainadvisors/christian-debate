"use client";

import { useState } from "react";
import QRCode from "qrcode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MfaState = "idle" | "setup" | "verify" | "recovery" | "disable-confirm";

export function MfaSetup({ mfaEnabled: initialMfaEnabled }: { mfaEnabled: boolean }) {
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaEnabled);
  const [state, setState] = useState<MfaState>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStartSetup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start MFA setup");
        return;
      }
      setManualCode(data.secret);
      const dataUrl = await QRCode.toDataURL(data.otpauthUri, { width: 200 });
      setQrDataUrl(dataUrl);
      setState("setup");
    } catch {
      setError("Failed to start MFA setup");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }
      setRecoveryCodes(data.recoveryCodes);
      setMfaEnabled(true);
      setState("recovery");
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }
      setMfaEnabled(false);
      setState("idle");
      setDisableCode("");
    } catch {
      setError("Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        {state === "idle" && (
          <div>
            <p className="mb-4 text-sm text-foreground/60">
              {mfaEnabled
                ? "Two-factor authentication is enabled. You'll need your authenticator app to sign in."
                : "Add an extra layer of security to your account with two-factor authentication."}
            </p>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            {mfaEnabled ? (
              <button
                onClick={() => { setState("disable-confirm"); setError(""); }}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Disable MFA
              </button>
            ) : (
              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Enable MFA"}
              </button>
            )}
          </div>
        )}

        {state === "setup" && (
          <div>
            <p className="mb-4 text-sm text-foreground/60">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="mb-4 flex justify-center">
              {qrDataUrl && <img src={qrDataUrl} alt="MFA QR Code" className="rounded-lg" />}
            </div>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-foreground/60 hover:text-foreground">
                Can&apos;t scan? Enter code manually
              </summary>
              <code className="mt-2 block break-all rounded bg-muted p-2 text-sm">
                {manualCode}
              </code>
            </details>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 rounded-lg border border-foreground/10 bg-transparent px-4 py-2 text-sm focus:border-primary focus:outline-none"
                maxLength={6}
              />
              <button
                onClick={handleVerify}
                disabled={loading || verifyCode.length < 6}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "..." : "Verify"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={() => { setState("idle"); setError(""); }}
              className="mt-3 text-sm text-foreground/60 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {state === "recovery" && (
          <div>
            <p className="mb-2 text-sm font-medium text-green-600">
              MFA enabled successfully!
            </p>
            <p className="mb-4 text-sm text-foreground/60">
              Save these recovery codes in a safe place. Each can only be used once.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-muted p-4">
              {recoveryCodes.map((code) => (
                <code key={code} className="text-sm font-mono">{code}</code>
              ))}
            </div>
            <button
              onClick={() => { setState("idle"); setRecoveryCodes([]); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        )}

        {state === "disable-confirm" && (
          <div>
            <p className="mb-4 text-sm text-foreground/60">
              Enter a code from your authenticator app or a recovery code to disable MFA.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="flex-1 rounded-lg border border-foreground/10 bg-transparent px-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleDisable}
                disabled={loading || !disableCode}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {loading ? "..." : "Disable"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={() => { setState("idle"); setError(""); setDisableCode(""); }}
              className="mt-3 text-sm text-foreground/60 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
