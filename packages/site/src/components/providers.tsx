"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";
import { GuestBanner } from "./guest/guest-banner";
import { GuestAutoSubmitter } from "./guest/guest-auto-submitter";
import { SignInModalProvider } from "./auth/sign-in-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SignInModalProvider>
          <Toaster position="bottom-right" />
          <GuestAutoSubmitter />
          <GuestBanner />
          {children}
        </SignInModalProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
