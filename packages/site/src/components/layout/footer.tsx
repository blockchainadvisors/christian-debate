import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Christians Debate. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
        <p className="mt-3 text-center text-muted-foreground/70 sm:text-left">
          Christians Debate is an independent platform for structured theological discussion.
          Views expressed by users are their own and do not represent the views of the platform operators.
        </p>
      </div>
    </footer>
  );
}
