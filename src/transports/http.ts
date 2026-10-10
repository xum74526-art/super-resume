import { createServer, type ServerResponse, type IncomingMessage } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer, VERSION } from '../mcp/server.js';

export type HttpOptions = { allowedHosts: string[]; allowedOrigins?: string[]; maxConcurrentRequests?: number };
const MAX_BODY_BYTES = 8 * 1024 * 1024;

function json(response: ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(payload));
}

async function bodyOf(request: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const raw of request) {
    const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('TOO_LARGE');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

export function createHttpServer(options: HttpOptions) {
  const hosts = new Set(options.allowedHosts.map((host) => host.toLowerCase()));
  if (!hosts.size) throw new Error('At least one allowed Host is required.');
  const origins = new Set(options.allowedOrigins ?? []);
  let active = 0;
  const server = createServer(async (request, response) => {
    let hostname = '';
    try { hostname = new URL(`http://${request.headers.host ?? ''}`).hostname.toLowerCase(); } catch { /* rejected below */ }
    if (!hosts.has(hostname)) return json(response, 403, { error: 'Host not allowed' });
    // Native clients normally omit Origin. Browser origins require explicit opt-in.
    if (request.headers.origin && !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin not allowed' });
    if (request.method === 'GET' && request.url === '/health') return json(response, 200, { status: 'ok', name: 'super-resume', version: VERSION });
    if (request.url !== '/mcp') return json(response, 404, { error: 'Not found' });
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return json(response, 405, { error: 'This stateless MCP endpoint accepts POST only' });
    }
    if (!/^application\/json(?:\s*;|$)/iu.test(request.headers['content-type'] ?? '')) return json(response, 415, { error: 'Content-Type must be application/json' });
    if (Number(request.headers['content-length'] ?? 0) > MAX_BODY_BYTES) return json(response, 413, { error: 'Request exceeds 8 MiB' });
    if (active >= (options.maxConcurrentRequests ?? 16)) return json(response, 429, { error: 'Too many concurrent requests' });
    active++;
    response.once('close', () => { active--; });
    let body: unknown;
    try { body = await bodyOf(request); } catch (error) {
      if (!response.destroyed) json(response, error instanceof Error && error.message === 'TOO_LARGE' ? 413 : 400, { error: 'Invalid or oversized JSON body' });
      return;
    }
    const mcp = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    response.once('close', () => { void mcp.close().catch(() => {}); });
    try {
      await mcp.connect(transport);
      await transport.handleRequest(request, response, body);
    } catch {
      if (!response.headersSent) json(response, 500, { error: 'MCP request failed' });
      else response.end();
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  return server;
}
