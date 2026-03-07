import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateUniqueUsername(displayName: string): Promise<string> {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30) || "user";

  let username = base;
  let attempt = 0;

  while (attempt < 20) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!existing) return username;

    attempt++;
    username = `${base}${Math.floor(Math.random() * 10000)}`;
  }

  return `${base}${Date.now()}`;
}
