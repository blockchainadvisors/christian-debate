"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        const data = await res.json();
        if (res.status === 429) {
          setStatus("error");
        } else {
          setStatus(data.error ? "error" : "sent");
        }
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="rounded-lg border border-foreground/10 p-8">
        <div className="mb-4 text-4xl">&#9993;</div>
        <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
        <p className="mb-6 text-foreground/60">
          We sent a verification link to{" "}
          {email ? <strong>{email}</strong> : "your email"}. Click the link to
          verify your account.
        </p>
        {email && (
          <div>
            {status === "idle" && (
              <button
                onClick={handleResend}
                className="text-sm font-medium text-primary hover:underline"
              >
                Didn&apos;t receive it? Resend
              </button>
            )}
            {status === "sending" && (
              <p className="text-sm text-foreground/60">Sending...</p>
            )}
            {status === "sent" && (
              <p className="text-sm text-green-600">
                New verification email sent!
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600">
                Please wait before requesting another email.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
