"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SiteInfo {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  niche: string | null;
}

export function NetworkDiscovery() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("/api/federation/proxy/sites");
        if (!res.ok) throw new Error("Failed to load sites");
        const data = await res.json();
        setSites(data.sites ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sites");
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No sites have joined the network yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sites.map((site) => (
        <a
          key={site.id}
          href={site.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-[1.02]"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {site.name}
                {site.niche && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {site.niche}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="truncate">
                {site.baseUrl}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visit this site to join their debates
              </p>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}
