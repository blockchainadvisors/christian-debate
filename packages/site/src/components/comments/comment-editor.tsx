"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CommentEditorProps {
  debateId: string;
  debateSlug: string;
  sideALabel: string;
  sideBLabel: string;
  parentId?: string;
  onSubmit: () => void;
  initialContent?: string;
}

const STANCE_OPTIONS = [
  { value: "side_a" },
  { value: "side_b" },
  { value: "neutral" },
  { value: "meta" },
] as const;

export function CommentEditor({
  debateId,
  debateSlug,
  sideALabel,
  sideBLabel,
  parentId,
  onSubmit,
  initialContent,
}: CommentEditorProps) {
  const [stanceSide, setStanceSide] = useState<string>("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? "",
    immediatelyRender: false,
  });

  const handleSubmit = async () => {
    if (!editor) return;

    const html = editor.getHTML();
    const text = editor.getText().trim();

    if (text.length < 1) {
      setError("Comment cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/debates/${debateSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: html,
          stanceSide,
          parentId: parentId ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post comment.");
        return;
      }

      editor.commands.clearContent();
      setStanceSide("neutral");
      onSubmit();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function getStanceLabel(option: (typeof STANCE_OPTIONS)[number]): string {
    switch (option.value) {
      case "side_a":
        return sideALabel;
      case "side_b":
        return sideBLabel;
      case "neutral":
        return "Neutral";
      case "meta":
        return "Meta";
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-background">
      {/* Stance picker */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Your stance</Label>
        <div className="flex flex-wrap gap-2">
          {STANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStanceSide(option.value)}
              className={cn(
                "px-3 py-2 text-sm rounded-full border transition-colors min-h-[44px]",
                stanceSide === option.value
                  ? option.value === "side_a"
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : option.value === "side_b"
                      ? "bg-red-100 border-red-300 text-red-800"
                      : option.value === "meta"
                        ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                        : "bg-gray-100 border-gray-300 text-gray-800"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {getStanceLabel(option)}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            B
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            &bull; List
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Ordered List"
          >
            1. List
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            &ldquo; Quote
          </ToolbarButton>
        </div>
      )}

      {/* Editor */}
      <div className="min-h-[100px] border border-gray-200 rounded-md p-3 prose prose-sm max-w-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <EditorContent editor={editor} />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting} size="sm">
          {isSubmitting ? "Posting..." : parentId ? "Post Reply" : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "px-2.5 py-2 text-xs rounded transition-colors min-h-[44px] min-w-[44px]",
        active
          ? "bg-gray-200 text-gray-900"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {children}
    </button>
  );
}
