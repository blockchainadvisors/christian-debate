"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BurdenOfProofRequest {
  id: string;
  commentId: string;
  flagCount: number;
  status: "pending" | "citation_provided" | "upheld" | "dismissed";
  citationUrl: string | null;
  citationUpvotes: number;
  createdAt: string;
  resolvedAt: string | null;
}

interface BurdenOfProofNoticeProps {
  burdenRequest: BurdenOfProofRequest;
  commentAuthorId: string;
  currentUserId?: string;
}

function getTimeRemaining(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const deadline = created + 72 * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = deadline - now;

  if (remaining <= 0) return "Expired";

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

export function BurdenOfProofNotice({
  burdenRequest,
  commentAuthorId,
  currentUserId,
}: BurdenOfProofNoticeProps) {
  const [citationUrl, setCitationUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [request, setRequest] = useState(burdenRequest);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = currentUserId === commentAuthorId;

  const handleSubmitCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citationUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/comments/${request.commentId}/burden-of-proof`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citationUrl: citationUrl.trim() }),
        }
      );

      if (res.ok) {
        const updated = await res.json();
        setRequest(updated);
        setCitationUrl("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit citation");
      }
    } catch {
      setError("Failed to submit citation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    setIsUpvoting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/comments/${request.commentId}/burden-of-proof/upvote`,
        { method: "POST" }
      );

      if (res.ok) {
        const updated = await res.json();
        setRequest(updated);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to upvote citation");
      }
    } catch {
      setError("Failed to upvote citation");
    } finally {
      setIsUpvoting(false);
    }
  };

  if (request.status === "pending") {
    return (
      <div
        className={cn(
          "rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm",
          "dark:border-yellow-700 dark:bg-yellow-950"
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
            Citation Requested
          </span>
        </div>
        <p className="mt-1 text-yellow-800 dark:text-yellow-200">
          This claim has been flagged as unsourced by the community. The author
          has 72 hours to provide a source.
        </p>
        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
          {getTimeRemaining(request.createdAt)}
        </p>

        {isAuthor && currentUserId && (
          <form onSubmit={handleSubmitCitation} className="mt-3">
            <label
              htmlFor="citation-url"
              className="block text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1"
            >
              Provide a citation URL
            </label>
            <div className="flex gap-2">
              <input
                id="citation-url"
                type="url"
                value={citationUrl}
                onChange={(e) => setCitationUrl(e.target.value)}
                placeholder="https://example.com/source"
                className={cn(
                  "flex-1 rounded-md border border-yellow-300 bg-white px-3 py-1.5 text-sm",
                  "dark:border-yellow-600 dark:bg-yellow-900 dark:text-yellow-100",
                  "focus:outline-none focus:ring-2 focus:ring-yellow-500"
                )}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white",
                  "hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-yellow-500"
                )}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (request.status === "citation_provided") {
    return (
      <div
        className={cn(
          "rounded-md border border-blue-300 bg-blue-50 p-4 text-sm",
          "dark:border-blue-700 dark:bg-blue-950"
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            Citation Provided
          </span>
        </div>
        <p className="mt-1 text-blue-800 dark:text-blue-200">
          <a
            href={request.citationUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            {request.citationUrl}
          </a>
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Was this helpful?
          </span>
          <button
            onClick={handleUpvote}
            disabled={isUpvoting || !currentUserId}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-blue-300 px-2 py-1 text-xs",
              "text-blue-700 bg-white hover:bg-blue-100",
              "dark:border-blue-600 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
            {request.citationUpvotes}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (request.status === "upheld") {
    return (
      <div
        className={cn(
          "rounded-md border border-green-300 bg-green-50 p-4 text-sm",
          "dark:border-green-700 dark:bg-green-950"
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-green-600 dark:text-green-400 font-semibold">
            Citation Verified
          </span>
        </div>
        <p className="mt-1 text-green-800 dark:text-green-200">
          The community accepted the provided source.
        </p>
        {request.citationUrl && (
          <p className="mt-1">
            <a
              href={request.citationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 dark:text-green-300 underline hover:no-underline"
            >
              {request.citationUrl}
            </a>
          </p>
        )}
      </div>
    );
  }

  if (request.status === "dismissed") {
    return (
      <div
        className={cn(
          "rounded-md border border-red-300 bg-red-50 p-4 text-sm",
          "dark:border-red-700 dark:bg-red-950"
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-red-600 dark:text-red-400 font-semibold">
            Unsupported Claim
          </span>
        </div>
        <p className="mt-1 text-red-800 dark:text-red-200">
          No citation was provided within 72 hours.
        </p>
      </div>
    );
  }

  return null;
}
