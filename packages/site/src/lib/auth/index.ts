import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts as accountsTable, federatedIdentity, mfaSecrets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { magicLinkEmailTemplate } from "@/lib/email/templates";
import { verifyMfaToken, decryptSecret, verifyRecoveryCode } from "./mfa";
import { rateLimit } from "@/lib/rate-limit";
import { generateAppleClientSecret } from "./apple-secret";
import { generateUniqueUsername } from "./utils";

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google,
    ...(process.env.AUTH_APPLE_TEAM_ID
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: generateAppleClientSecret(),
          }),
        ]
      : []),
    Facebook,
    MicrosoftEntraId,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaToken: { label: "MFA Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const mfaToken = (credentials.mfaToken as string) || "";

        const { allowed } = await rateLimit(`login:${email}`, 10, 900);
        if (!allowed) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        const [mfa] = await db
          .select()
          .from(mfaSecrets)
          .where(and(eq(mfaSecrets.userId, user.id), eq(mfaSecrets.verified, true)))
          .limit(1);

        if (mfa) {
          if (!mfaToken) {
            throw new Error("MFARequired");
          }
          const secret = decryptSecret(mfa.encryptedSecret);
          const isValidMfa = verifyMfaToken(secret, mfaToken);
          if (!isValidMfa) {
            // Try recovery codes
            if (mfa.recoveryCodes) {
              const codes: string[] = JSON.parse(mfa.recoveryCodes);
              const matchIndex = codes.findIndex((c) => verifyRecoveryCode(mfaToken, c));
              if (matchIndex === -1) return null;
              // Remove used recovery code
              codes.splice(matchIndex, 1);
              await db
                .update(mfaSecrets)
                .set({ recoveryCodes: JSON.stringify(codes) })
                .where(eq(mfaSecrets.id, mfa.id));
            } else {
              return null;
            }
          }
        }

        return {
          id: user.id,
          name: user.displayName,
          email: user.email,
          image: user.avatarUrl,
        };
      },
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST || "localhost",
        port: parseInt(process.env.SMTP_PORT || "1025", 10),
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      },
      from: process.env.EMAIL_FROM || "Christians Debate <noreply@christiansdebate.com>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // Rewrite URL to use AUTH_URL to avoid localhost in emails
        const canonicalUrl = process.env.AUTH_URL;
        const finalUrl = canonicalUrl
          ? url.replace(/^https?:\/\/[^/]+/, canonicalUrl)
          : url;
        await sendEmail({
          to: email,
          subject: "Sign in to Christians Debate",
          html: magicLinkEmailTemplate(finalUrl),
        });
      },
      maxAge: 600, // 10 minutes
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

      // For magic link sign-ins, create user if needed
      if (account.type === "email") {
        try {
          let [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1);

          if (!existingUser) {
            const displayName = user.email!.split("@")[0];
            const username = await generateUniqueUsername(displayName);

            const [newUser] = await db
              .insert(users)
              .values({
                email: user.email!,
                displayName,
                username,
                emailVerified: new Date(),
              })
              .returning();
            existingUser = newUser;
          } else if (!existingUser.emailVerified) {
            await db
              .update(users)
              .set({ emailVerified: new Date() })
              .where(eq(users.id, existingUser.id));
          }

          user.id = existingUser.id;
        } catch (error) {
          console.error("Magic link sign-in error:", error);
          return false;
        }
      }

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
    error: "/login",
    verifyRequest: "/verify-email",
  },
}));
