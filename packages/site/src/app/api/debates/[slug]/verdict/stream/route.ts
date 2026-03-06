import { NextRequest } from "next/server";
import { db } from "@/db";
import { debates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [debate] = await db
    .select({ id: debates.id })
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1);

  if (!debate) {
    return new Response("Debate not found", { status: 404 });
  }

  const debateId = debate.id;
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial tally from cache, or fetch from REST endpoint
      let initialData = await redis.get(`debate:${debateId}:verdict`);
      if (!initialData) {
        // Cache miss — fetch from REST endpoint to populate cache and get real data
        try {
          const res = await fetch(new URL(`/api/debates/${slug}/verdict`, request.url));
          if (res.ok) {
            initialData = JSON.stringify(await res.json());
          }
        } catch {}
      }
      sendEvent(initialData ?? JSON.stringify({ tally: { sideA: 0, sideB: 0, draw: 0, totalVoters: 0, verifiedNeutralCount: 0 }, pinnedComments: [] }));

      let lastData = initialData;

      // Poll every 5 seconds
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const currentData = await redis.get(`debate:${debateId}:verdict`);
          if (currentData && currentData !== lastData) {
            lastData = currentData;
            sendEvent(currentData);
          }
        } catch {
          closed = true;
          clearInterval(interval);
        }
      }, 5000);

      // Handle abort
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
