"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";
import { ThemeSelector } from "@/components/theme-selector";
import { useGuestCache } from "@/hooks/use-guest-cache";
import { useSignInModal } from "@/components/auth/sign-in-modal";

const NAV_LINKS = [
  { href: "/debates", label: "Debates" },
  { href: "/debates/new", label: "New Debate", authRequired: true },
];

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const { counts } = useGuestCache();
  const { openSignIn } = useSignInModal();
  const pendingCount = counts.comments + counts.votes + counts.stances;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    // Redirect away from auth-only pages (profile, settings, etc.)
    if (pathname.startsWith("/u/") || pathname.startsWith("/settings") || pathname.startsWith("/debates/new")) {
      router.push("/debates");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        {/* Mobile hamburger */}
        <MobileNav
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          pendingCount={pendingCount}
          onSignOut={handleSignOut}
          onSignIn={openSignIn}
        />

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold tracking-tight">
          <img
            src="/icons/logo-40.png"
            alt=""
            width={28}
            height={28}
            className="shrink-0 rounded-md bg-white/90 p-0.5 dark:bg-white/90"
          />
          <span className="hidden sm:inline">Christians Debate</span>
          <span className="sm:hidden">CD</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {NAV_LINKS.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop auth section */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <ThemeSelector />
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name ?? "User avatar"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.name ?? user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" className="relative" onClick={openSignIn}>
              Sign In
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
