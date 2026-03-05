import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteRegistrations } from "@/db/schema";
import { checkHubAdmin } from "@/lib/auth";
import {
  generateApiKey,
  generateClientId,
  generateClientSecret,
} from "@/lib/crypto";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** GET /api/sites — list all registered sites (admin only) */
export async function GET(req: NextRequest) {
  const denied = checkHubAdmin(req);
  if (denied) return denied;

  const sites = await db.select().from(siteRegistrations);
  return NextResponse.json(sites);
}

/** POST /api/sites — register a new site */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, baseUrl, niche, adminEmail } = body as {
    name?: string;
    baseUrl?: string;
    niche?: string;
    adminEmail?: string;
  };

  if (!name || !baseUrl) {
    return NextResponse.json(
      { error: "name and baseUrl are required" },
      { status: 400 },
    );
  }

  const slug = slugify(name);
  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const apiKey = generateApiKey();

  const [site] = await db
    .insert(siteRegistrations)
    .values({
      name,
      slug,
      baseUrl,
      niche: niche ?? null,
      adminEmail: adminEmail ?? null,
      clientId,
      clientSecret,
      apiKey,
      trustStatus: "pending",
    })
    .returning();

  // Return the full credentials — this is the ONLY time they are shown
  return NextResponse.json(
    {
      ...site,
      clientId,
      clientSecret,
      apiKey,
    },
    { status: 201 },
  );
}
