import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createHttpServer } from '../src/transports/http.js';

const expectedTools = ['apply_resume_patch', 'create_resume', 'export_resume', 'get_resume_schema', 'import_resume_document', 'list_resume_templates', 'match_job', 'preview_resume', 'validate_resume'];

test('stdio performs MCP handshake, lists tools/resources/prompts, and transforms a resume', async () => {
  const client = new Client({ name: 'stdio-integration-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', import.meta.resolve('tsx'), fileURLToPath(new URL('../src/cli.ts', import.meta.url))],
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), expectedTools);
    assert((await client.listResources()).resources.some((resource) => resource.uri === 'resume://schema'));
    assert((await client.listPrompts()).prompts.some((prompt) => prompt.name === 'tailor_resume'));
    const templates = await client.callTool({ name: 'list_resume_templates', arguments: {} });
    assert(!templates.isError);
    const preview = await client.callTool({ name: 'preview_resume', arguments: { resume: { basics: { name: '预览测试' } }, template: 'modern' } });
    assert(!preview.isError, JSON.stringify(preview));
    assert((preview.content as Array<{ type: string; resource?: { mimeType?: string } }>).some((item) => item.type === 'resource' && item.resource?.mimeType === 'image/svg+xml'));
    assert(!JSON.stringify(preview.structuredContent).includes('<svg'));
    const created = await client.callTool({ name: 'create_resume', arguments: { name: '测试用户', label: '工程师' } });
    const { resume, revision } = (created.structuredContent as { result: { resume: object; revision: string } }).result;
    const edited = await client.callTool({ name: 'apply_resume_patch', arguments: { resume, expectedRevision: revision, operations: [{ op: 'add', path: '/basics/summary', value: '用户提供的真实简介' }] } });
    assert(!edited.isError);
    const bad = await client.callTool({ name: 'apply_resume_patch', arguments: { resume, expectedRevision: '0'.repeat(64), operations: [{ op: 'remove', path: '/work' }] } });
    assert.equal(bad.isError, true);
    const exported = await client.callTool({ name: 'export_resume', arguments: { resume, format: 'json' } });
    assert(!exported.isError);
    const binary = await client.callTool({ name: 'export_resume', arguments: { resume, format: 'pdf' } });
    assert(!binary.isError, JSON.stringify(binary));
    const resource = (binary.content as Array<{ type: string; resource?: { blob: string } }>).find((item) => item.type === 'resource')?.resource;
    assert(resource);
    assert(Buffer.from(resource.blob, 'base64').subarray(0, 5).equals(Buffer.from('%PDF-')));
    assert(!JSON.stringify(binary.structuredContent).includes(resource.blob));
    const imported = await client.callTool({ name: 'import_resume_document', arguments: { format: 'pdf', contentBase64: resource.blob } });
    assert(!imported.isError, JSON.stringify(imported));
    assert((imported.structuredContent as { result: { text: string } }).result.text.includes('测试用户'));
    const unsupported = await client.callTool({ name: 'export_resume', arguments: { resume, format: 'html' } });
    assert(!unsupported.isError);
    const communityHtml = await client.callTool({ name: 'export_resume', arguments: { resume, template: 'editorial', format: 'html' } });
    assert(!communityHtml.isError, JSON.stringify(communityHtml));
    const htmlResource = (communityHtml.content as Array<{ type: string; resource?: { mimeType: string; blob: string } }>).find(item => item.type === 'resource')?.resource;
    assert(htmlResource?.mimeType === 'text/html');
    assert(Buffer.from(htmlResource.blob, 'base64').toString().includes('测试用户'));
  } finally { await client.close(); }
});

test('Streamable HTTP works statelessly with the official MCP client', async () => {
  const server = createHttpServer({ allowedHosts: ['127.0.0.1'] });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  const client = new Client({ name: 'http-integration-test', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), expectedTools);
    const first = await client.callTool({ name: 'create_resume', arguments: { name: 'A' } });
    const second = await client.callTool({ name: 'create_resume', arguments: { name: 'B' } });
    assert.equal((first.structuredContent as { result: { resume: { basics: { name: string } } } }).result.resume.basics.name, 'A');
    assert.equal((second.structuredContent as { result: { resume: { basics: { name: string } } } }).result.resume.basics.name, 'B');
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/health`, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    const invalidHostStatus = await new Promise<number | undefined>((resolve, reject) => {
      const request = httpRequest(`${base}/health`, { headers: { Host: 'untrusted.example' } }, (response) => { response.resume(); resolve(response.statusCode); });
      request.on('error', reject);
      request.end();
    });
    assert.equal(invalidHostStatus, 403);
    assert.equal((await fetch(`${base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(`${base}/mcp`, { method: 'POST', body: '{}' })).status, 415);
    const docx = await client.callTool({ name: 'export_resume', arguments: { resume: { basics: { name: 'HTTP 文档测试' } }, format: 'docx' } });
    assert(!docx.isError, JSON.stringify(docx));
    assert.equal((await fetch(`${base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'a'.repeat(8 * 1024 * 1024) }) })).status, 413);
  } finally {
    await client.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
