"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("email", { email, redirect: false });

      if (result?.error) {
        setError("Could not send magic link. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-sm text-foreground/60">
          Check your email for a sign-in link. It expires in 10 minutes.
        </p>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Magic Link"}
      </button>
    </form>
  );
}
