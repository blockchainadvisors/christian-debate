"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Visibility = "public" | "mutual_only" | "private";

interface VisibilityControlsProps {
  currentVisibility: Visibility;
  onChange: (visibility: Visibility) => void;
}

const visibilityOptions: Array<{
  value: Visibility;
  label: string;
  description: string;
}> = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can see your profile on this site",
  },
  {
    value: "mutual_only",
    label: "Mutual Only",
    description: "Only users on sites you both participate in",
  },
  {
    value: "private",
    label: "Private",
    description: "SSO only -- no cross-site profile sharing",
  },
];

export function VisibilityControls({
  currentVisibility,
  onChange,
}: VisibilityControlsProps) {
  const current = visibilityOptions.find((o) => o.value === currentVisibility);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Profile Visibility</label>
      <Select value={currentVisibility} onValueChange={(v) => onChange(v as Visibility)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select visibility" />
        </SelectTrigger>
        <SelectContent>
          {visibilityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current && (
        <p className="text-xs text-muted-foreground">{current.description}</p>
      )}
    </div>
  );
}
