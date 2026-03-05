"use client";

import {
  FlaskConical,
  Heart,
  DollarSign,
  ClipboardList,
  MessageCircle,
  Scale,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaxonomyTag, ArgumentTaxonomy } from "@/types/taxonomy";
import { TAXONOMY_META } from "@/types/taxonomy";

const iconMap: Record<ArgumentTaxonomy, React.ElementType> = {
  empirical: FlaskConical,
  moral_ethical: Heart,
  economic: DollarSign,
  procedural: ClipboardList,
  anecdotal: MessageCircle,
  legal: Scale,
  historical: Clock,
};

const colorClasses: Record<ArgumentTaxonomy, string> = {
  empirical: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  moral_ethical: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  economic: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  procedural: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  anecdotal: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  legal: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  historical: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
};

interface TaxonomyTagsProps {
  tags: TaxonomyTag[];
  commentId: string;
}

export function TaxonomyTags({ tags, commentId }: TaxonomyTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" data-comment-id={commentId}>
      {tags.map((tag) => {
        const taxonomy = tag.taxonomy as ArgumentTaxonomy;
        const meta = TAXONOMY_META[taxonomy];
        const Icon = iconMap[taxonomy];

        if (!meta || !Icon) return null;

        return (
          <Badge
            key={taxonomy}
            variant="outline"
            className={cn(
              "gap-1 text-[11px] font-medium",
              colorClasses[taxonomy]
            )}
          >
            <Icon className="size-3" />
            {meta.label} ({tag.count})
          </Badge>
        );
      })}
    </div>
  );
}
