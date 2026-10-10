import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, readJson, publisher, validatePublisher, registryMetadata } from './lib.mjs';

const ajv2020 = new Ajv2020({ allErrors: true, strict: false });
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv2020);
addFormats(ajv);
for (const [file, schemaFile, instance] of [
  ['plugins/super-resume/plugin.json', 'plugin.schema.json', ajv2020],
  ['plugins/super-resume/mcp.json', 'mcp.schema.json', ajv2020],
]) {
  const validate = instance.compile(await readJson(`distribution/schemas/${schemaFile}`));
  assert(validate(await readJson(file)), `${file}: ${JSON.stringify(validate.errors)}`);
}
const pkg = await readJson('package.json');
const portable = await readJson('plugins/super-resume/plugin.json');
const claude = await readJson('plugins/super-resume/.claude-plugin/plugin.json');
assert.equal(portable.version, pkg.version);
assert.equal(claude.version, pkg.version);
assert.equal(portable.name, claude.name);
const nativeMcp = await readJson('plugins/super-resume/.mcp.json');
assert.equal(nativeMcp.mcpServers['super-resume'].command, 'node');
assert.deepEqual(nativeMcp.mcpServers['super-resume'].args, ['${CLAUDE_PLUGIN_ROOT}/bin/super-resume.cjs', '--stdio']);
const commonMcp = await readJson('plugins/super-resume/mcp.json');
assert.deepEqual(commonMcp.mcpServers['super-resume'].args, ['${PLUGIN_ROOT}/bin/super-resume.cjs', '--stdio']);
const skill = await readFile(resolve('plugins/super-resume/skills/super-resume/SKILL.md'), 'utf8');
assert(skill.startsWith('---\nname: super-resume\n'));
assert(!/\bTODO\b|\bPLACEHOLDER\b/u.test(skill));
assert((await stat(resolve('plugins/super-resume/bin/super-resume.cjs'))).size > 0);
assert.equal(await readFile(resolve('dist/cli.cjs'), 'utf8'), await readFile(resolve('plugins/super-resume/bin/super-resume.cjs'), 'utf8'));
for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) {
  const marketplace = await readJson(file);
  const source = marketplace.plugins[0].source;
  assert.equal(typeof source === 'string' ? source : source.path, './plugins/super-resume');
}

// Smoke-test the exact bundle that a plugin host will launch, not just source modules.
const client = new Client({ name: 'distribution-validator', version: '1.0.0' });
const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('plugins/super-resume/bin/super-resume.cjs')], stderr: 'pipe' });
const errors = [];
try {
  await client.connect(transport);
  transport.stderr?.on('data', (chunk) => errors.push(String(chunk)));
  const { tools } = await client.listTools();
  assert.equal(tools.length, 9);
  const response = await client.callTool({ name: 'create_resume', arguments: { name: 'Plugin smoke test' } });
  assert(!response.isError);
  assert.equal(response.structuredContent.result.resume.basics.name, 'Plugin smoke test');
  assert.equal(errors.length, 0, 'Unexpected runtime stderr');
} finally { await client.close(); }

const config = await publisher();
if (config) {
  validatePublisher(config);
  const metadata = await readJson('distribution/server.json');
  assert.deepEqual(metadata, registryMetadata(config, pkg.version), 'Registry metadata is stale; run npm run build.');
  const validate = ajv.compile(await readJson('distribution/schemas/server.schema.json'));
  assert(validate(metadata), JSON.stringify(validate.errors));
}
if (process.argv.includes('--publish')) {
  try { validatePublisher(config); }
  catch (error) { console.error(`Public release not configured: ${error.message}`); process.exit(1); }
}
console.log(`Distribution validated: portable manifest, Claude wiring, marketplaces, skill, bundled MCP handshake${config ? ', Registry schema' : ' (public publisher identity still unconfigured)'}.`);
