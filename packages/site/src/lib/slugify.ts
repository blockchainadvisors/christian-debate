import { db } from "@/db";
import { debates } from "@/db/schema";
import { eq } from "drizzle-orm";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: debates.id })
      .from(debates)
      .where(eq(debates.slug, slug))
      .limit(1);

    if (existing.length === 0) return slug;

    counter++;
    slug = `${base}-${counter}`;
  }
}
