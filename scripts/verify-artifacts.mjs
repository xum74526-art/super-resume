import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdtemp, mkdir, writeFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { unzipSync } from 'fflate';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, readJson, run } from './lib.mjs';

const pkg = await readJson('package.json');
const mode = process.argv.includes('--publish') ? 'public' : 'local';
const artifactDir = resolve('artifacts', pkg.version, mode);
const tempBase = await realpath(os.tmpdir());
const scratch = await mkdtemp(path.join(tempBase, 'super-resume-artifact-test-'));
function safeMember(member) {
  return member && !member.startsWith('/') && !member.includes('\\') && !member.split('/').includes('..') && !/^[a-z]:/iu.test(member);
}
function distributableMember(member) {
  return !/(?:^|\/)(?:references|\.git|\.cache|\.env(?:\.[^/]*)?|node_modules|tests|src)(?:\/|$)/u.test(member);
}
async function extractZip(filename, targetDir) {
  const zip = unzipSync(new Uint8Array(await readFile(path.join(artifactDir, filename))));
  for (const [name, content] of Object.entries(zip)) {
    assert(safeMember(name), 'Unsafe ZIP entry');
    assert(distributableMember(name), `Unexpected private or development file: ${name}`);
    const target = path.join(targetDir, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return zip;
}
try {
  const portableDir = path.join(scratch, 'plugin');
  const marketplaceDir = path.join(scratch, 'marketplace');
  const zipName = `super-resume-plugin-${pkg.version}.zip`;
  const marketplaceName = `super-resume-marketplace-${pkg.version}.zip`;
  const zip = await extractZip(zipName, portableDir);
  const marketplace = await extractZip(marketplaceName, marketplaceDir);
  assert(zip['README.md'], 'Standalone plugin must include installation guidance');
  assert(marketplace['README.md'], 'Marketplace must include installation guidance');
  for (const [name, bytes] of Object.entries(zip)) {
    assert.deepEqual(marketplace[`plugins/super-resume/${name}`], bytes, `Marketplace plugin differs: ${name}`);
  }
  assert.equal(Object.keys(marketplace).length, Object.keys(zip).length + 3, 'Unexpected marketplace contents');
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) {
    const catalog = JSON.parse(Buffer.from(marketplace[file]).toString('utf8'));
    assert.equal(catalog.name, 'super-resume');
    const source = catalog.plugins[0].source;
    const relative = typeof source === 'string' ? source : source.path;
    assert.equal(relative, './plugins/super-resume');
    const manifest = JSON.parse(await readFile(path.join(marketplaceDir, relative, 'plugin.json'), 'utf8'));
    assert.equal(manifest.version, pkg.version);
  }
  const files = await readdir(artifactDir);
  const tarName = files.find((file) => file.endsWith('.tgz'));
  assert(tarName, 'Missing npm tarball');
  const tarPath = path.join(artifactDir, tarName);
  const members = run('tar', ['-tzf', tarPath]).trim().split(/\r?\n/u);
  assert(members.every((name) => safeMember(name) && distributableMember(name) && name.startsWith('package/')), 'Unsafe npm tar entry');
  const checksums = (await readFile(path.join(artifactDir, 'SHA256SUMS.txt'), 'utf8')).trim().split(/\r?\n/u);
  const checked = [];
  for (const line of checksums) {
    const match = /^([a-f0-9]{64})  ([^/\\]+)$/u.exec(line);
    assert(match, 'Invalid checksum entry');
    const [, hash, filename] = match;
    assert.equal(createHash('sha256').update(await readFile(path.join(artifactDir, filename))).digest('hex'), hash, `Checksum mismatch: ${filename}`);
    checked.push(filename);
  }
  assert.deepEqual(checked.sort(), [zipName, marketplaceName, tarName].sort());
  run('tar', ['-xzf', tarPath, '-C', scratch]);
  const staged = JSON.parse(await readFile(path.join(scratch, 'package/package.json'), 'utf8'));
  assert.equal(staged.private, mode !== 'public');
  assert.equal(staged.version, pkg.version);
  for (const executable of [path.join(portableDir, 'bin/super-resume.cjs'), path.join(marketplaceDir, 'plugins/super-resume/bin/super-resume.cjs'), path.join(scratch, 'package/dist/cli.cjs')]) {
    assert.equal(run(process.execPath, [executable, '--version'], { cwd: scratch }).trim(), pkg.version);
    const sourceFile = path.join(path.dirname(executable), 'fixture.json');
    const outputFile = path.join(path.dirname(executable), 'fixture.pdf');
    await writeFile(sourceFile, JSON.stringify({ basics: { name: '本地文件命令测试' } }));
    const fileResult = JSON.parse(run(process.execPath, [executable, 'export', sourceFile, '--out', outputFile], { cwd: scratch }));
    assert.equal(fileResult.persisted, true);
    assert.equal(fileResult.savedTo, outputFile);
    const originalOutput = await readFile(outputFile);
    assert.throws(() => run(process.execPath, [executable, 'export', sourceFile, '--out', outputFile], { cwd: scratch }), /EEXIST/u);
    assert((await readFile(outputFile)).equals(originalOutput), 'Refused overwrite changed the existing file');
    assert(JSON.parse(run(process.execPath, [executable, 'import', outputFile], { cwd: scratch })).text.replace(/\s/gu, '').includes('本地文件命令测试'));
    const client = new Client({ name: 'extracted-artifact-test', version: '1.0.0' });
    try {
      await client.connect(new StdioClientTransport({ command: process.execPath, args: [executable], cwd: scratch, stderr: 'pipe' }));
      assert.equal((await client.listTools()).tools.length, 9);
      const library = await client.callTool({ name: 'list_resume_templates', arguments: { query: 'han-vermilion', limit: 5 } });
      assert(!library.isError && library.structuredContent.result.total === 1);
      const communityPreview = await client.callTool({ name: 'preview_resume', arguments: { resume: { basics: { name: '独立社区模板测试' } }, template: 'editorial' } });
      assert(!communityPreview.isError, JSON.stringify(communityPreview));
      assert(communityPreview.content.some(item => item.type === 'resource' && item.resource.mimeType === 'image/svg+xml' && item.resource.text.includes('独立社区模板测试')));
      const html = await client.callTool({ name: 'export_resume', arguments: { resume: { basics: { name: '独立社区模板测试' } }, template: 'editorial', format: 'html' } });
      assert(!html.isError, JSON.stringify(html));
      assert(Buffer.from(html.content.find(item => item.type === 'resource').resource.blob, 'base64').toString().includes('独立社区模板测试'));
      const preview = await client.callTool({ name: 'preview_resume', arguments: { resume: { basics: { name: '独立模板预览' } }, template: 'han-vermilion' } });
      assert(!preview.isError, JSON.stringify(preview));
      assert(preview.content.some((item) => item.type === 'resource' && item.resource.mimeType === 'image/svg+xml'));
      const response = await client.callTool({ name: 'validate_resume', arguments: { resume: { basics: { name: 'Standalone package test' } } } });
      assert(!response.isError);
      assert.equal(response.structuredContent.result.valid, true);
      for (const format of ['pdf', 'docx']) {
        const exported = await client.callTool({ name: 'export_resume', arguments: { resume: { basics: { name: '独立安装包验证', summary: 'Chinese and English 文本' } }, format, template: 'folded-silver' } });
        assert(!exported.isError, JSON.stringify(exported));
        const resource = exported.content.find((item) => item.type === 'resource')?.resource;
        assert(resource?.blob, 'Missing binary artifact');
        const imported = await client.callTool({ name: 'import_resume_document', arguments: { format, contentBase64: resource.blob } });
        assert(!imported.isError, JSON.stringify(imported));
        assert(imported.structuredContent.result.text.replace(/\s/gu, '').includes('独立安装包验证'));
      }
    } finally { await client.close(); }
  }
  console.log('Marketplace ZIP, standalone plugin ZIP and npm tarball passed checksum, content and MCP checks plus Chinese PDF/DOCX export/import outside the project, without installing dependencies.');
} finally {
  const actual = await realpath(scratch);
  if (path.dirname(actual) !== tempBase || !path.basename(actual).startsWith('super-resume-artifact-test-')) throw new Error('Refusing to remove an unexpected test directory.');
  await rm(actual, { recursive: true });
}
