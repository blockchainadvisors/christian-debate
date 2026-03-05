import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface UserProfileCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    trustTier: string;
    reputationScore: number;
  };
}

const trustTierColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-800",
  established: "bg-blue-100 text-blue-800",
  trusted: "bg-green-100 text-green-800",
  moderator: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
};

export function UserProfileCard({ user }: UserProfileCardProps) {
  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/u/${user.username}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center gap-3 py-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {user.displayName}
              </span>
              <Badge
                className={`text-[10px] ${trustTierColors[user.trustTier] ?? ""}`}
                variant="outline"
              >
                {user.trustTier}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Rep: {user.reputationScore}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
