"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { RegisterForm } from "@/components/auth/register-form";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

const AGORA_HUB_URL = process.env.NEXT_PUBLIC_AGORA_HUB_URL;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.3-3.74 4.25z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0">
      <path d="M1 1h10.5v10.5H1z" fill="#F25022" />
      <path d="M12.5 1H23v10.5H12.5z" fill="#7FBA00" />
      <path d="M1 12.5h10.5V23H1z" fill="#00A4EF" />
      <path d="M12.5 12.5H23V23H12.5z" fill="#FFB900" />
    </svg>
  );
}

function AgoraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

const SSO_PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "apple", label: "Continue with Apple", icon: AppleIcon },
  { id: "facebook", label: "Continue with Facebook", icon: FacebookIcon },
  { id: "microsoft-entra-id", label: "Continue with Microsoft", icon: MicrosoftIcon },
];

type SubView = "default" | "magic-link" | "forgot-password" | "check-email";

function SSOButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="flex flex-col gap-2">
      {SSO_PROVIDERS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => signIn(id, { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-foreground/10 px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition-colors"
        >
          <Icon />
          {label}
        </button>
      ))}
      {AGORA_HUB_URL && (
        <button
          onClick={() => signIn("agora", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <AgoraIcon />
          Sign in with Agora Network
        </button>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-foreground/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-background px-2 text-foreground/40">or</span>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const verified = searchParams.get("verified");
  const reset = searchParams.get("reset");
  const error = searchParams.get("error");

  const [subView, setSubView] = useState<SubView>("default");
  const [registeredEmail, setRegisteredEmail] = useState("");

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col items-center justify-center px-4">
      {verified === "true" && (
        <div className="mb-4 w-full rounded-lg bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Email verified! You can now sign in.
        </div>
      )}
      {reset === "true" && (
        <div className="mb-4 w-full rounded-lg bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Password reset successfully. Sign in with your new password.
        </div>
      )}
      {error === "InvalidToken" && (
        <div className="mb-4 w-full rounded-lg bg-red-50 p-3 text-center text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Invalid or expired verification link.
        </div>
      )}

      {subView === "check-email" ? (
        <div className="w-full text-center">
          <div className="mb-4 text-4xl">&#9993;</div>
          <h1 className="mb-2 text-2xl font-bold">Check Your Email</h1>
          <p className="mb-6 text-foreground/60">
            We sent a verification link to <strong>{registeredEmail}</strong>.
            Click it to verify your account, then sign in.
          </p>
          <button
            onClick={() => setSubView("default")}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </button>
        </div>
      ) : subView === "magic-link" ? (
        <div className="w-full">
          <h1 className="mb-6 text-center text-2xl font-bold">Magic Link</h1>
          <MagicLinkForm />
          <div className="mt-4 text-center">
            <button
              onClick={() => setSubView("default")}
              className="text-sm text-foreground/60 hover:text-foreground"
            >
              Back to sign in
            </button>
          </div>
        </div>
      ) : subView === "forgot-password" ? (
        <div className="w-full">
          <h1 className="mb-6 text-center text-2xl font-bold">Reset Password</h1>
          <ForgotPasswordForm onBack={() => setSubView("default")} />
        </div>
      ) : (
        <div className="w-full">
          <Tabs defaultValue="signin" className="w-full">
            <h1 className="mb-4 text-center text-3xl font-bold">Welcome</h1>
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-4">
              <SSOButtons callbackUrl={callbackUrl} />
              <Divider />
              <EmailSignInForm onForgotPassword={() => setSubView("forgot-password")} />
              <div className="mt-3 text-center">
                <button
                  onClick={() => setSubView("magic-link")}
                  className="text-sm text-foreground/60 hover:text-foreground"
                >
                  Use magic link instead
                </button>
              </div>
            </TabsContent>
            <TabsContent value="register" className="pt-4">
              <SSOButtons callbackUrl={callbackUrl} />
              <Divider />
              <RegisterForm onSuccess={(email) => { setRegisteredEmail(email); setSubView("check-email"); }} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
