import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/time-ago";

export interface DebateCardData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sideALabel: string;
  sideBLabel: string;
  status: "open" | "locked" | "archived";
  tags: string[] | null;
  createdAt: Date | string;
  creatorName: string | null;
  creatorUsername: string | null;
}

function statusVariant(status: string) {
  switch (status) {
    case "open":
      return "default" as const;
    case "locked":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

export function DebateCard({ debate }: { debate: DebateCardData }) {
  const createdAt = typeof debate.createdAt === "string" ? new Date(debate.createdAt) : debate.createdAt;

  return (
    <Link href={`/d/${debate.slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base group-hover:text-primary/80 transition-colors">
              {debate.title}
            </CardTitle>
            <Badge variant={statusVariant(debate.status)} className="shrink-0 capitalize">
              {debate.status}
            </Badge>
          </div>
          {debate.description && (
            <CardDescription className="line-clamp-2">
              {debate.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 debate-side-dot--a" />
              <span className="text-muted-foreground truncate max-w-[120px]">{debate.sideALabel}</span>
            </div>
            <span className="text-muted-foreground/50">vs</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 debate-side-dot--b" />
              <span className="text-muted-foreground truncate max-w-[120px]">{debate.sideBLabel}</span>
            </div>
          </div>

          {debate.tags && debate.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {debate.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground justify-between">
          <span>{debate.creatorName || debate.creatorUsername || "Anonymous"}</span>
          <span>{timeAgo(createdAt)}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
