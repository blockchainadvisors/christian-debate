import { NextRequest } from "next/server";
import { getOidcProvider } from "@/lib/oidc";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

/**
 * Adapts a Next.js App Router request to a Node.js IncomingMessage/ServerResponse
 * pair so that oidc-provider (which uses Koa internally) can process it.
 */
async function handleOidcRequest(req: NextRequest): Promise<Response> {
  const provider = await getOidcProvider();

  const url = new URL(req.url);
  // Map /api/oidc/* to the OIDC provider's expected paths
  const oidcPath = url.pathname.replace(/^\/api\/oidc/, "") || "/";

  // Build a Node.js-compatible IncomingMessage
  const body = req.body ? Buffer.from(await req.arrayBuffer()) : undefined;

  const socket = new Socket();
  const incoming = new IncomingMessage(socket);
  incoming.method = req.method;
  incoming.url = oidcPath + url.search;
  incoming.headers = Object.fromEntries(req.headers.entries());
  incoming.headers.host = url.host;

  // Push body data if present
  if (body && body.length > 0) {
    incoming.push(body);
  }
  incoming.push(null);

  // Create a ServerResponse that captures the output
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

  // Get the Koa callback and invoke it
  const callback = provider.callback();

  await new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
    callback(incoming, res).catch(reject);
  });

  // Build the Web Response from the captured ServerResponse
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
  const statusCode = res.statusCode || 200;

  return new Response(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest) {
  return handleOidcRequest(req);
}

export async function POST(req: NextRequest) {
  return handleOidcRequest(req);
}
