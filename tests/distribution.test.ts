import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, realpath, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';

test('publisher configuration generates valid Registry metadata in an isolated fixture and rejects unsafe identities', async () => {
  const project = fileURLToPath(new URL('../', import.meta.url));
  const base = await realpath(os.tmpdir());
  const fixture = await mkdtemp(path.join(base, 'super-resume-publisher-test-'));
  try {
    for (const directory of ['scripts', '.claude-plugin', 'distribution/licenses']) await mkdir(path.join(fixture, directory), { recursive: true });
    for (const file of ['scripts/lib.mjs', 'scripts/configure-publisher.mjs', 'distribution/licenses/MIT.txt', '.claude-plugin/marketplace.json']) await copyFile(path.join(project, file), path.join(fixture, file));
    await writeFile(path.join(fixture, 'package.json'), JSON.stringify({ name: 'local-fixture', version: '0.1.0', private: true }));
    const script = path.join(fixture, 'scripts/configure-publisher.mjs');
    const args = [script, '--github', 'fixture-publisher/resume-fixture', '--npm', '@fixture-publisher/super-resume-mcp', '--author', 'Isolated test fixture', '--license', 'MIT'];
    execFileSync(process.execPath, args, { cwd: fixture, encoding: 'utf8' });
    const metadata = JSON.parse(await readFile(path.join(fixture, 'distribution/server.json'), 'utf8'));
    assert.equal(metadata.name, 'io.github.fixture-publisher/super-resume');
    assert.equal(metadata.packages[0].identifier, '@fixture-publisher/super-resume-mcp');
    assert.equal(metadata.packages[0].version, metadata.version);
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats.default(ajv);
    const validate = ajv.compile(JSON.parse(await readFile(path.join(project, 'distribution/schemas/server.schema.json'), 'utf8')));
    assert(validate(metadata), JSON.stringify(validate.errors));
    assert((await readFile(path.join(fixture, 'LICENSE'), 'utf8')).includes('Isolated test fixture'));
    assert.equal(JSON.parse(await readFile(path.join(fixture, 'package.json'), 'utf8')).private, true);
    const before = await readFile(path.join(fixture, 'distribution/publisher.json'), 'utf8');
    const badArgs = args.map((value) => value === 'fixture-publisher/resume-fixture' ? '../invalid' : value);
    const rejected = spawnSync(process.execPath, badArgs, { cwd: fixture, encoding: 'utf8' });
    assert.notEqual(rejected.status, 0);
    assert.equal(await readFile(path.join(fixture, 'distribution/publisher.json'), 'utf8'), before);
  } finally {
    const actual = await realpath(fixture);
    if (path.dirname(actual) !== base || !path.basename(actual).startsWith('super-resume-publisher-test-')) throw new Error('Refusing unexpected test cleanup target');
    await rm(actual, { recursive: true });
  }
});
