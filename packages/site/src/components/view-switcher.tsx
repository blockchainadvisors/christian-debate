"use client";

import { lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SidesView } from "@/components/views/sides-view";
import { BestExchangesView } from "@/components/views/best-exchanges-view";
import { VerdictView } from "@/components/views/verdict-view";

const ThreadView = lazy(() =>
  import("@/components/views/thread-view").then((mod) => ({
    default: mod.ThreadView,
  }))
);

const AnalyticsView = lazy(() =>
  import("@/components/views/analytics-view").then((mod) => ({
    default: mod.AnalyticsView,
  }))
);

const VIEWS = [
  { value: "thread", label: "Thread" },
  { value: "sides", label: "Sides" },
  { value: "best-exchanges", label: "Best Exchanges" },
  { value: "verdict", label: "Verdict" },
  { value: "analytics", label: "Analytics" },
] as const;

interface ViewSwitcherProps {
  debate: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    sideALabel: string;
    sideBLabel: string;
    status: string;
    tags: string[] | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ViewSwitcher({ debate }: ViewSwitcherProps) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const validViews = VIEWS.map((v) => v.value) as readonly string[];
  const defaultView = viewParam && validViews.includes(viewParam) ? viewParam : "thread";

  return (
    <Tabs defaultValue={defaultView} className="w-full">
      <TabsList className="flex w-full">
        {VIEWS.map((view) => (
          <TabsTrigger key={view.value} value={view.value}>
            {view.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="thread" className="mt-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
              <div className="h-8 animate-pulse rounded-full bg-muted" />
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
          }
        >
          <ThreadView debate={debate} />
        </Suspense>
      </TabsContent>

      <TabsContent value="sides" className="mt-6">
        <SidesView debate={debate} />
      </TabsContent>

      <TabsContent value="best-exchanges" className="mt-6">
        <BestExchangesView debate={debate} />
      </TabsContent>

      <TabsContent value="verdict" className="mt-6">
        <VerdictView debate={debate} />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          }
        >
          <AnalyticsView debate={debate} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
