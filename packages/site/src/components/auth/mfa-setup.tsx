"use client";

import { useState } from "react";
import QRCode from "qrcode";

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
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4L8 1.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h3>
        </div>
        {state === "idle" && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              mfaEnabled
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                mfaEnabled ? "bg-emerald-500" : "bg-muted-foreground/40"
              }`}
            />
            {mfaEnabled ? "Enabled" : "Disabled"}
          </span>
        )}
      </div>

      <div className="px-6 py-5">
        {/* Idle state */}
        {state === "idle" && (
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mfaEnabled
                ? "Your account is protected with two-factor authentication. You\u2019ll need your authenticator app to sign in."
                : "Add an extra layer of security by requiring a verification code from your authenticator app when signing in."}
            </p>
            {error && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="mt-4">
              {mfaEnabled ? (
                <button
                  onClick={() => { setState("disable-confirm"); setError(""); }}
                  className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                >
                  Disable MFA
                </button>
              ) : (
                <button
                  onClick={handleStartSetup}
                  disabled={loading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Setting up\u2026" : "Enable MFA"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Setup state — QR code */}
        {state === "setup" && (
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {/* QR code display */}
            <div className="my-5 flex justify-center">
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="MFA QR Code" className="rounded-lg" width={200} height={200} />
                )}
              </div>
            </div>

            {/* Manual code */}
            <details className="group mb-5">
              <summary className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                <span className="ml-1">Can&apos;t scan? Enter code manually</span>
              </summary>
              <div className="mt-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <code className="break-all text-sm font-mono text-foreground">{manualCode}</code>
              </div>
            </details>

            {/* Verification input */}
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="flex-1 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                maxLength={6}
              />
              <button
                onClick={handleVerify}
                disabled={loading || verifyCode.length < 6}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "\u2026" : "Verify"}
              </button>
            </div>
            {error && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              onClick={() => { setState("idle"); setError(""); }}
              className="mt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Recovery codes */}
        {state === "recovery" && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <polyline points="2 8 6 12 14 4" />
                </svg>
              </span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                MFA enabled successfully
              </span>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Save these recovery codes
              </p>
              <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/70">
                Store them in a safe place. Each code can only be used once. If you lose access to your authenticator app, these are the only way to recover your account.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-4">
              {recoveryCodes.map((code) => (
                <code
                  key={code}
                  className="rounded bg-background px-2 py-1 text-center text-sm font-mono tracking-wide text-foreground"
                >
                  {code}
                </code>
              ))}
            </div>

            <button
              onClick={() => { setState("idle"); setRecoveryCodes([]); }}
              className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              I&apos;ve saved my codes
            </button>
          </div>
        )}

        {/* Disable confirmation */}
        {state === "disable-confirm" && (
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Enter a code from your authenticator app or a recovery code to disable two-factor authentication.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Authenticator or recovery code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={handleDisable}
                disabled={loading || !disableCode}
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {loading ? "\u2026" : "Disable"}
              </button>
            </div>
            {error && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              onClick={() => { setState("idle"); setError(""); setDisableCode(""); }}
              className="mt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
