"use client";

import { signIn } from "next-auth/react";

const AGORA_HUB_URL = process.env.NEXT_PUBLIC_AGORA_HUB_URL;

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-3xl font-bold">Sign In</h1>
      <div className="flex w-full flex-col gap-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full rounded-lg border border-foreground/10 px-4 py-3 text-sm font-medium hover:bg-foreground/5"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full rounded-lg border border-foreground/10 px-4 py-3 text-sm font-medium hover:bg-foreground/5"
        >
          Continue with GitHub
        </button>
        {AGORA_HUB_URL && (
          <button
            onClick={() => signIn("agora", { callbackUrl: "/" })}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign in with Agora Network
          </button>
        )}
      </div>
    </main>
  );
}
