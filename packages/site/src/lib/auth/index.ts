import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, accounts as accountsTable, federatedIdentity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.displayName,
          email: user.email,
          image: user.avatarUrl,
        };
      },
    }),
    ...(process.env.AGORA_HUB_URL
      ? [
          {
            id: "agora",
            name: "Agora Network",
            type: "oidc" as const,
            issuer: process.env.AGORA_HUB_URL + "/api/oidc",
            clientId: process.env.AGORA_CLIENT_ID!,
            clientSecret: process.env.AGORA_CLIENT_SECRET!,
          },
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !user.email) return true;

      // For OAuth providers, create or link user + account manually
      if (account.type === "oauth" || account.type === "oidc") {
        try {
          // Check if account link already exists
          const [existingAccount] = await db
            .select()
            .from(accountsTable)
            .where(
              and(
                eq(accountsTable.provider, account.provider),
                eq(accountsTable.providerAccountId, account.providerAccountId)
              )
            )
            .limit(1);

          if (existingAccount) {
            // Account already linked — update tokens
            await db
              .update(accountsTable)
              .set({
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                id_token: account.id_token,
              })
              .where(eq(accountsTable.id, existingAccount.id));
            // Set user.id to the database user ID so JWT picks it up
            user.id = existingAccount.userId;
          } else {
            // Find or create user
            let [existingUser] = await db
              .select()
              .from(users)
              .where(eq(users.email, user.email))
              .limit(1);

            if (!existingUser) {
              const displayName = user.name || profile?.name || user.email.split("@")[0];
              const username = await generateUniqueUsername(displayName);

              const [newUser] = await db
                .insert(users)
                .values({
                  email: user.email,
                  displayName,
                  username,
                  avatarUrl: user.image || null,
                  emailVerified: new Date(),
                })
                .returning();
              existingUser = newUser;
            }

            // Link the OAuth account
            await db.insert(accountsTable).values({
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | undefined,
            });

            // Set user.id so jwt callback picks it up
            user.id = existingUser.id;
          }

          // Handle Agora federation linking
          if (account.provider === "agora" && user.id) {
            const [existing] = await db
              .select()
              .from(federatedIdentity)
              .where(eq(federatedIdentity.localUserId, user.id))
              .limit(1);

            if (existing) {
              await db
                .update(federatedIdentity)
                .set({
                  hubUserId: account.providerAccountId,
                  syncedAt: new Date(),
                })
                .where(eq(federatedIdentity.localUserId, user.id));
            } else {
              await db.insert(federatedIdentity).values({
                localUserId: user.id,
                hubUserId: account.providerAccountId,
              });
            }
          }
        } catch (error) {
          console.error(`OAuth sign-in error (${account.provider}):`, error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
      }
      // On first OAuth sign-in, look up user by account if id wasn't set
      if (account && !token.id && (account.type === "oauth" || account.type === "oidc")) {
        const [linked] = await db
          .select({ userId: accountsTable.userId })
          .from(accountsTable)
          .where(
            and(
              eq(accountsTable.provider, account.provider),
              eq(accountsTable.providerAccountId, account.providerAccountId)
            )
          )
          .limit(1);
        if (linked) {
          token.id = linked.userId;
        }
      }
      if (account?.provider === "agora") {
        token.hubUserId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

async function generateUniqueUsername(displayName: string): Promise<string> {
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
