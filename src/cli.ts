#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer, VERSION } from './mcp/server.js';
import { createHttpServer } from './transports/http.js';
import { runFileCommand } from './file-cli.js';
import { createStudioServer } from './transports/studio.js';

async function main() {
  const args = process.argv.slice(2);
  if (await runFileCommand(args)) return;
  if (args.length === 1 && args[0] === '--studio') {
    const port = Number(process.env.SUPER_RESUME_STUDIO_PORT ?? '3141');
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SUPER_RESUME_STUDIO_PORT must be between 1 and 65535.');
    const server = createStudioServer();
    server.on('error', () => { process.stderr.write('Unable to start local studio. Choose another SUPER_RESUME_STUDIO_PORT.\n'); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => process.stderr.write(`Super Resume template studio: http://127.0.0.1:${port}\n`));
    for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { server.close(); server.closeAllConnections(); });
    return;
  }
  if (args.length === 1 && args[0] === '--version') { process.stdout.write(`${VERSION}\n`); return; }
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write('Super Resume MCP\n\nUsage: super-resume-mcp [--stdio|--http|--studio|--version|--help]\n       super-resume-mcp templates\n       super-resume-mcp import <resume.pdf|resume.docx>\n       super-resume-mcp export <resume.json> --out <file> [--format pdf|docx|html|json|markdown] [--template <id from templates>] [--locale zh-CN|en] [--force]\n\nMCP default: stdio. HTTP binds to 127.0.0.1:3000. Local template studio: http://127.0.0.1:3141 (SUPER_RESUME_STUDIO_PORT).\nFile commands read/write only explicitly named files. Export refuses to overwrite unless --force is supplied.\nHTTP settings: SUPER_RESUME_HOST, SUPER_RESUME_PORT, SUPER_RESUME_ALLOWED_HOSTS, SUPER_RESUME_ALLOWED_ORIGINS.\n');
    return;
  }
  if (args.length > 1 || (args[0] !== undefined && !['--stdio', '--http'].includes(args[0]))) throw new Error('Unknown arguments; run with --help.');
  if (args[0] === '--http') {
    const host = process.env.SUPER_RESUME_HOST ?? '127.0.0.1';
    const portValue = process.env.SUPER_RESUME_PORT ?? '3000';
    if (!/^\d+$/u.test(portValue)) throw new Error('SUPER_RESUME_PORT must be an integer.');
    const port = Number(portValue);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SUPER_RESUME_PORT must be between 1 and 65535.');
    const allowedHosts = process.env.SUPER_RESUME_ALLOWED_HOSTS?.split(',').map((value) => value.trim()).filter(Boolean);
    if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !allowedHosts?.length) throw new Error('Set SUPER_RESUME_ALLOWED_HOSTS explicitly before binding outside loopback.');
    const server = createHttpServer({
      allowedHosts: allowedHosts ?? ['127.0.0.1', 'localhost', '[::1]'],
      allowedOrigins: process.env.SUPER_RESUME_ALLOWED_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    });
    server.on('error', () => { process.stderr.write('Unable to start HTTP listener. Check host and port.\n'); process.exitCode = 1; });
    server.listen(port, host, () => process.stderr.write(`Super Resume ${VERSION}: HTTP listener ready on port ${port}\n`));
    for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { server.close(); server.closeAllConnections(); });
  } else {
    const mcp = createMcpServer();
    await mcp.connect(new StdioServerTransport());
    for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void mcp.close().then(() => process.exit(0)); });
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Failed to start Super Resume'}\n`);
  process.exitCode = 1;
});
