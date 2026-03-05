"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MobileNavProps {
  isAuthenticated: boolean;
  userName?: string | null;
  onSignOut: () => void;
}

const NAV_LINKS = [
  { href: "/debates", label: "Debates" },
  { href: "/debates/new", label: "New Debate", authRequired: true },
];

export function MobileNav({
  isAuthenticated,
  userName,
  onSignOut,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-lg font-bold"
            >
              Christian Debate
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
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

        <div className="mt-auto border-t pt-4 mt-6">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              {userName && (
                <p className="px-3 py-1 text-sm text-muted-foreground">
                  {userName}
                </p>
              )}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-accent-foreground"
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-accent hover:text-accent-foreground"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
