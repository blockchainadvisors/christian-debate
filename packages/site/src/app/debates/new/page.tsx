"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NewDebatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sideALabel, setSideALabel] = useState("");
  const [sideBLabel, setSideBLabel] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.length < 3 || title.length > 300) {
      setError("Title must be between 3 and 300 characters.");
      return;
    }
    if (sideALabel.length < 1 || sideALabel.length > 100) {
      setError("Side A label must be between 1 and 100 characters.");
      return;
    }
    if (sideBLabel.length < 1 || sideBLabel.length > 100) {
      setError("Side B label must be between 1 and 100 characters.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          sideALabel,
          sideBLabel,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create debate.");
        setIsSubmitting(false);
        return;
      }

      const debate = await res.json();
      router.push(`/d/${debate.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Start a New Debate</CardTitle>
          <CardDescription>
            Frame a question or proposition with two clear sides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Is baptism required for salvation?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/300 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide context, relevant scripture references, or framing for the debate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sideA">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />
                  Side A Label
                </Label>
                <Input
                  id="sideA"
                  placeholder="e.g. Yes, it is required"
                  value={sideALabel}
                  onChange={(e) => setSideALabel(e.target.value)}
                  required
                  minLength={1}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sideB">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />
                  Side B Label
                </Label>
                <Input
                  id="sideB"
                  placeholder="e.g. No, it is symbolic"
                  value={sideBLabel}
                  onChange={(e) => setSideBLabel(e.target.value)}
                  required
                  minLength={1}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g. theology, baptism, salvation"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Debate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
