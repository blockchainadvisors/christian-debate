"use client";

import { useState } from "react";

export function RegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError("An account with this email already exists");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      onSuccess(email);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
        required
      />
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
        placeholder="Password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
        required
        minLength={8}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full rounded-lg border border-foreground/10 bg-transparent px-4 py-3 text-sm focus:border-primary focus:outline-none"
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
