import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, federatedIdentity } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
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
    async signIn({ user, account }) {
      if (account?.provider === "agora" && user?.id && account.providerAccountId) {
        try {
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
        } catch (error) {
          console.error("Failed to link federated identity on sign-in:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
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
