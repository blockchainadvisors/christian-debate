import { NextRequest } from "next/server";
import { getOidcProvider } from "@/lib/oidc";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

/**
 * Serves the OIDC discovery document at /.well-known/openid-configuration
 */
async function handleDiscovery(req: NextRequest): Promise<Response> {
  const provider = await getOidcProvider();

  const url = new URL(req.url);

  const socket = new Socket();
  const incoming = new IncomingMessage(socket);
  incoming.method = req.method;
  incoming.url = "/.well-known/openid-configuration";
  incoming.headers = Object.fromEntries(req.headers.entries());
  incoming.headers.host = url.host;
  incoming.push(null);

  const res = new ServerResponse(incoming);

  const chunks: Buffer[] = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = (chunk: unknown, ...args: unknown[]) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    }
    return (originalWrite as Function)(chunk, ...args);
  };

  res.end = (chunk?: unknown, ...args: unknown[]) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    }
    return (originalEnd as Function)(chunk, ...args);
  };

  const callback = provider.callback();

  await new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
    callback(incoming, res).catch(reject);
  });

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(res.getHeaders())) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) responseHeaders.append(key, v);
    } else {
      responseHeaders.set(key, String(value));
    }
  }

  const responseBody = chunks.length > 0 ? Buffer.concat(chunks) : null;

  return new Response(responseBody, {
    status: res.statusCode || 200,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest) {
  return handleDiscovery(req);
}
