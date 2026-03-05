import { redirect } from "next/navigation";
import { NetworkDiscovery } from "@/components/federation/network-discovery";
import { NetworkLeaderboard } from "@/components/federation/network-leaderboard";
import { NetworkStats } from "./network-stats";

export const metadata = {
  title: "Agora Network - Christian Debate",
  description: "Browse sites and top debaters across the Agora network",
};

export default function NetworkPage() {
  if (!process.env.AGORA_HUB_URL) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agora Network</h1>
        <p className="mt-2 text-muted-foreground">
          Discover debate communities and top persuaders across the network.
        </p>
      </div>

      {/* Network Stats */}
      <NetworkStats />

      {/* Site Directory */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Site Directory</h2>
        <NetworkDiscovery />
      </section>

      {/* Leaderboard */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">
          Cross-Site Leaderboard
        </h2>
        <NetworkLeaderboard />
      </section>
    </div>
  );
}
