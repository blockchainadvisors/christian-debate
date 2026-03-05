import Provider, { type ClientMetadata } from "oidc-provider";
import { db } from "@/db";
import { hubUsers, siteRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";

let _provider: Provider | null = null;

export async function getOidcProvider(): Promise<Provider> {
  if (_provider) return _provider;

  const issuer = process.env.HUB_URL || "http://localhost:4000";

  // Load registered site clients from the database
  const sites = await db.select().from(siteRegistrations);

  const clients: ClientMetadata[] = sites.map((site) => ({
    client_id: site.clientId,
    client_secret: site.clientSecret,
    redirect_uris: [`${site.baseUrl}/api/auth/callback/agora`],
    grant_types: ["authorization_code", "refresh_token"] as string[],
    response_types: ["code" as const],
    token_endpoint_auth_method: "client_secret_post" as const,
  }));

  _provider = new Provider(issuer, {
    clients,
    claims: {
      openid: ["sub"],
      profile: ["name", "picture"],
      email: ["email"],
    },
    features: {
      devInteractions: { enabled: false },
    },
    cookies: {
      keys: [process.env.HUB_COOKIE_SECRET || "dev-secret"],
    },
    pkce: {
      required: () => false,
    },
    async findAccount(_ctx, id) {
      const user = await db
        .select()
        .from(hubUsers)
        .where(eq(hubUsers.id, id))
        .then((rows) => rows[0]);

      if (!user) return undefined;

      return {
        accountId: user.id,
        async claims() {
          return {
            sub: user.id,
            name: user.displayName,
            picture: user.avatarUrl,
            email: user.email,
          };
        },
      };
    },
  });

  // Mount OIDC routes under /api/oidc
  _provider.proxy = true;

  return _provider;
}
