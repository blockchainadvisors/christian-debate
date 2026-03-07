"use client";

import { useState } from "react";

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-foreground/60">
          If an account exists with that email, we sent a password reset link.
        </p>
        <button
          onClick={onBack}
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-foreground/60">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        Back to sign in
      </button>
    </form>
  );
}
