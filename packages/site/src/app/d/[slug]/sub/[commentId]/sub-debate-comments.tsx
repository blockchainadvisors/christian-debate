"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CommentEditor } from "@/components/comments/comment-editor";

interface SubDebateCommentsProps {
  debateId: string;
  debateSlug: string;
  sideALabel: string;
  sideBLabel: string;
  thesisCommentId: string;
}

export function SubDebateComments({
  debateId,
  debateSlug,
  sideALabel,
  sideBLabel,
  thesisCommentId,
}: SubDebateCommentsProps) {
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);

  const handleSubmit = useCallback(() => {
    setShowEditor(false);
    router.refresh();
  }, [router]);

  if (!showEditor) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setShowEditor(true)}
          className="w-full rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          Add your argument to this sub-debate...
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Add your argument
      </h3>
      <CommentEditor
        debateId={debateId}
        debateSlug={debateSlug}
        sideALabel={sideALabel}
        sideBLabel={sideBLabel}
        parentId={thesisCommentId}
        onSubmit={handleSubmit}
      />
      <button
        onClick={() => setShowEditor(false)}
        className="mt-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
