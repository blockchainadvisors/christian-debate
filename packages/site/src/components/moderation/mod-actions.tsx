"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ModActionsProps {
  commentId: string;
  onAction: (commentId: string, action: "approve" | "remove") => void;
}

export function ModActions({ commentId, onAction }: ModActionsProps) {
  const [loading, setLoading] = useState<"approve" | "remove" | null>(null);

  async function handleAction(action: "approve" | "remove") {
    setLoading(action);
    try {
      onAction(commentId, action);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("remove")}
        disabled={loading !== null}
      >
        {loading === "remove" ? "Removing..." : "Remove"}
      </Button>
      <Button size="sm" variant="secondary" disabled>
        Lock Thread
      </Button>
    </div>
  );
}
