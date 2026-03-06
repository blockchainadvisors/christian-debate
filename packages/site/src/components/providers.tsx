"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { NavigationGuard } from "./guest/navigation-guard";
import { GuestBanner } from "./guest/guest-banner";
import { GuestAutoSubmitter } from "./guest/guest-auto-submitter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NavigationGuard>
          <GuestAutoSubmitter />
          <GuestBanner />
          {children}
        </NavigationGuard>
      </ThemeProvider>
    </SessionProvider>
  );
}
