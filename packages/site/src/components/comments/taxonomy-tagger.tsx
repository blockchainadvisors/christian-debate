"use client";

import { useState } from "react";
import {
  FlaskConical,
  Heart,
  DollarSign,
  ClipboardList,
  MessageCircle,
  Scale,
  Clock,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ArgumentTaxonomy } from "@/types/taxonomy";
import { TAXONOMY_META, TAXONOMY_VALUES } from "@/types/taxonomy";

const iconMap: Record<ArgumentTaxonomy, React.ElementType> = {
  empirical: FlaskConical,
  moral_ethical: Heart,
  economic: DollarSign,
  procedural: ClipboardList,
  anecdotal: MessageCircle,
  legal: Scale,
  historical: Clock,
};

const hoverColors: Record<ArgumentTaxonomy, string> = {
  empirical: "hover:bg-green-50 hover:text-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-300",
  moral_ethical: "hover:bg-purple-50 hover:text-purple-800 dark:hover:bg-purple-900/20 dark:hover:text-purple-300",
  economic: "hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-900/20 dark:hover:text-amber-300",
  procedural: "hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-300",
  anecdotal: "hover:bg-orange-50 hover:text-orange-800 dark:hover:bg-orange-900/20 dark:hover:text-orange-300",
  legal: "hover:bg-indigo-50 hover:text-indigo-800 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300",
  historical: "hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-900/20 dark:hover:text-teal-300",
};

interface TaxonomyTaggerProps {
  commentId: string;
  userTrustTier?: string;
}

export function TaxonomyTagger({ commentId, userTrustTier }: TaxonomyTaggerProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<ArgumentTaxonomy | null>(null);

  const isDisabled = !userTrustTier || userTrustTier === "new";

  async function handleTag(taxonomy: ArgumentTaxonomy) {
    if (isDisabled) return;

    setSubmitting(taxonomy);
    try {
      const res = await fetch(`/api/comments/${commentId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxonomy }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to tag:", data.error);
      }

      setOpen(false);
    } catch (error) {
      console.error("Failed to tag argument:", error);
    } finally {
      setSubmitting(null);
    }
  }

  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              disabled
              className="text-muted-foreground"
            >
              <Tag className="size-3.5" />
              Tag
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Earn &apos;established&apos; status to tag arguments
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" className="text-muted-foreground">
          <Tag className="size-3.5" />
          Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="mb-2 px-2 pt-1">
          <p className="text-sm font-medium">Tag Argument Type</p>
          <p className="text-xs text-muted-foreground">
            Categorize the type of argument being made
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          {TAXONOMY_VALUES.map((taxonomy) => {
            const meta = TAXONOMY_META[taxonomy];
            const Icon = iconMap[taxonomy];
            const isLoading = submitting === taxonomy;

            return (
              <button
                key={taxonomy}
                onClick={() => handleTag(taxonomy)}
                disabled={submitting !== null}
                className={cn(
                  "flex items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  hoverColors[taxonomy]
                )}
              >
                <div className="mt-0.5">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
