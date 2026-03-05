"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUSES = ["all", "open", "locked", "archived"] as const;

export function DebateSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentTag = searchParams.get("tag") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/debates?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Input
        placeholder="Search debates..."
        defaultValue={currentSearch}
        onChange={(e) => updateParams({ q: e.target.value })}
        className="sm:max-w-xs"
      />

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((status) => (
          <Button
            key={status}
            variant={currentStatus === status || (status === "all" && !currentStatus) ? "default" : "outline"}
            size="sm"
            onClick={() => updateParams({ status })}
            disabled={isPending}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {currentTag && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateParams({ tag: "" })}
        >
          Tag: {currentTag} &times;
        </Button>
      )}
    </div>
  );
}
