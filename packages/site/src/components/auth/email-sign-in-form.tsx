"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function EmailSignInForm({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        mfaToken: needsMfa ? mfaToken : "",
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("MFARequired")) {
          setNeedsMfa(true);
          setLoading(false);
          return;
        }
        if (result.error.includes("EmailNotVerified")) {
          setNeedsVerification(true);
          setLoading(false);
          return;
        }
        setError("Invalid email or password");
      } else if (result?.ok) {
        window.location.href = "/";
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
  }

  if (needsVerification) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-foreground/60">
          Your email is not verified yet. Please check your inbox or request a
          new verification email.
        </p>
        <button
          onClick={handleResendVerification}
          className="text-sm font-medium text-primary hover:underline"
        >
          Resend verification email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
        required
      />
      {needsMfa && (
        <input
          type="text"
          placeholder="6-digit code or recovery code"
          value={mfaToken}
          onChange={(e) => setMfaToken(e.target.value)}
          className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
          autoFocus
          required
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {needsMfa && (
        <p className="text-xs text-foreground/60">
          Enter the code from your authenticator app
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Signing in..." : needsMfa ? "Verify & Sign In" : "Sign In"}
      </button>
      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        Forgot password?
      </button>
    </form>
  );
}
