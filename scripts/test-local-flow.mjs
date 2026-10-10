import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { performance } from 'node:perf_hooks';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, readJson } from './lib.mjs';

const { values } = parseArgs({ options: {
  'plugin-root': { type: 'string', default: resolve('plugins/super-resume') },
  label: { type: 'string', default: 'local' },
} });
assert(/^[a-z0-9-]+$/u.test(values.label), 'Use a simple label such as codex or claude');
const pluginRoot = path.resolve(values['plugin-root']);
const version = (await readJson('package.json')).version;
const source = await readJson('examples/resume.layout.zh-CN.json');
const original = structuredClone(source);
const jobDescription = '虚构测试岗位：后端工程师。要求 TypeScript、Node.js 服务开发，PostgreSQL 和 SQL 数据处理，接口文档与集成测试。Redis 与 Kubernetes 为加分项。';
const requirements = [
  { text: 'TypeScript、Node.js 服务开发', keywords: ['TypeScript', 'Node.js'] },
  { text: 'PostgreSQL 与 SQL 数据处理', keywords: ['PostgreSQL', 'SQL'] },
  { text: '接口文档与集成测试', keywords: ['接口文档', '集成测试'] },
  { text: 'Redis 与 Kubernetes 加分项', keywords: ['Redis', 'Kubernetes'] },
];
const started = performance.now();
await mkdir(resolve('artifacts/local-test'), { recursive: true });
const output = await mkdtemp(resolve('artifacts/local-test', `${values.label}-${version}-`));
const report = {
  status: 'running', version, client: values.label, pluginRoot,
  node: process.version, platform: os.platform(), fictionalData: true,
  tools: [], steps: [], exports: [],
  scope: 'Official MCP SDK calls against the installed plugin bundle; not a native model conversation or desktop UI test.',
};
const client = new Client({ name: 'super-resume-local-user-flow', version });
const transport = new StdioClientTransport({
  command: process.execPath, args: [path.join(pluginRoot, 'bin/super-resume.cjs'), '--stdio'],
  // Running away from the source tree catches accidental relative-path dependencies.
  cwd: output, stderr: 'pipe',
});
let stderr = '';
transport.stderr?.on('data', (data) => { stderr += String(data); });
async function call(name, args, expectedError) {
  const start = performance.now();
  const response = await client.callTool({ name, arguments: args });
  const error = response.isError ? JSON.parse(response.content.find((item) => item.type === 'text').text) : null;
  assert.equal(error?.code, expectedError, `${name}: ${JSON.stringify(error)}`);
  report.steps.push({ tool: name, status: expectedError ? 'expected_error' : 'passed', ...(error ? { code: error.code } : {}), milliseconds: Math.round(performance.now() - start) });
  return { result: response.structuredContent?.result, content: response.content };
}
try {
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, version);
  report.tools = (await client.listTools()).tools.map((tool) => tool.name).sort();
  assert.deepEqual(report.tools, ['apply_resume_patch', 'create_resume', 'export_resume', 'get_resume_schema', 'import_resume_document', 'list_resume_templates', 'match_job', 'preview_resume', 'validate_resume']);
  assert((await client.listResources()).resources.some((resource) => resource.uri === 'resume://schema'));
  assert((await client.listPrompts()).prompts.some((prompt) => prompt.name === 'tailor_resume'));
  const prompt = await client.getPrompt({ name: 'tailor_resume', arguments: { jobDescription } });
  assert(prompt.messages.some((message) => message.content.type === 'text' && message.content.text.includes('Kubernetes')));
  const schema = (await call('get_resume_schema', {})).result;
  assert.deepEqual(schema.exportFormats, ['json', 'markdown', 'pdf', 'docx', 'html']);
  assert((await call('list_resume_templates', {})).result.total === 117);
  assert.equal((await call('list_resume_templates', { query: '蓝金折角' })).result.templates[0]?.id, 'bluegold-classic');
  const folded = (await call('list_resume_templates', { query: '折角' })).result;
  for (const id of ['bluegold-classic', 'folded-navy', 'folded-jade', 'folded-wine', 'folded-slate', 'folded-sand', 'folded-cobalt', 'folded-ink', 'folded-silver', 'folded-ivy', 'folded-campus', 'folded-circuit', 'folded-peach', 'folded-press', 'folded-lilac', 'folded-vermilion', 'folded-track']) assert(folded.templates.some(template => template.id === id));
  const designPreview = await call('preview_resume', { resume: source, template: 'han-vermilion' });
  assert(designPreview.content.some(item => item.type === 'resource' && item.resource.mimeType === 'image/svg+xml' && item.resource.text.includes(source.basics.name)));
  const designExport = await call('export_resume', { resume: source, template: 'han-vermilion', format: 'html' });
  const htmlBytes = Buffer.from(designExport.content.find(item => item.type === 'resource').resource.blob, 'base64');
  assert(htmlBytes.toString().includes(source.work[0].name));
  await writeFile(path.join(output, 'design-resume.html'), htmlBytes);

  const created = (await call('create_resume', { name: source.basics.name, label: source.basics.label })).result;
  const filled = (await call('apply_resume_patch', {
    resume: created.resume, expectedRevision: created.revision,
    operations: Object.entries(source).map(([key, value]) => ({ op: 'add', path: `/${key}`, value })),
  })).result;
  assert.deepEqual(filled.resume, source);
  const validation = (await call('validate_resume', { resume: filled.resume })).result;
  assert.equal(validation.valid, true);
  const match = (await call('match_job', { resume: filled.resume, requirements })).result;
  assert.equal(match.summary.allKeywordsPresent, 3);
  assert.deepEqual(match.results[3].missingKeywords, ['Redis', 'Kubernetes']);
  for (const requirement of match.results.slice(0, 3)) {
    assert(requirement.matches.every((item) => item.evidence.length > 0 && item.evidence.every((evidence) => evidence.path.startsWith('/'))));
  }
  await writeFile(path.join(output, 'job-description.txt'), `${jobDescription}\n`);
  await writeFile(path.join(output, 'job-match.json'), `${JSON.stringify(match, null, 2)}\n`);
  await writeFile(path.join(output, 'resume-before.json'), `${JSON.stringify(filled.resume, null, 2)}\n`);

  // This wording is based only on the explicitly fictional source fixture.
  const summary = '虚构简历，仅用于插件测试。使用 TypeScript 和 Node.js 开发订单服务，以 PostgreSQL 编写查询与报表，参与接口评审和集成测试，并编写部署说明及接口文档。';
  const tailored = (await call('apply_resume_patch', {
    resume: filled.resume, expectedRevision: validation.revision,
    operations: [{ op: 'replace', path: '/basics/summary', value: summary }],
  })).result;
  assert.notEqual(tailored.revision, validation.revision);
  assert.deepEqual(tailored.resume, { ...source, basics: { ...source.basics, summary } });
  assert.deepEqual(source, original);
  assert(!JSON.stringify(tailored.resume).includes('Redis'));
  assert(!JSON.stringify(tailored.resume).includes('Kubernetes'));
  await call('apply_resume_patch', {
    resume: tailored.resume, expectedRevision: validation.revision,
    operations: [{ op: 'replace', path: '/basics/name', value: 'Should not be applied' }],
  }, 'REVISION_CONFLICT');
  assert.equal((await call('validate_resume', { resume: tailored.resume })).result.valid, true);
  const preview = await call('preview_resume', { resume: tailored.resume, template: 'folded-silver' });
  assert(preview.content.some((item) => item.type === 'resource' && item.resource.mimeType === 'image/svg+xml'));
  assert.equal((await call('validate_resume', { resume: { basics: { name: source.basics.name, email: 'invalid-address' } } })).result.valid, false);

  for (const format of ['json', 'markdown', 'pdf', 'docx']) {
    const { result, content } = await call('export_resume', { resume: tailored.resume, format, locale: 'zh-CN', template: 'folded-silver' });
    assert.equal(result.sourceRevision, tailored.revision);
    assert.equal(result.persisted, false);
    const resource = content.find((item) => item.type === 'resource')?.resource;
    const bytes = resource?.blob ? Buffer.from(resource.blob, 'base64') : Buffer.from(result.content, 'utf8');
    assert.equal(bytes.length, result.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), result.sha256);
    const filename = `resume-tailored.${format === 'markdown' ? 'md' : format}`;
    await writeFile(path.join(output, filename), bytes);
    assert((await readFile(path.join(output, filename))).equals(bytes));
    if (format === 'json') assert.deepEqual(JSON.parse(bytes), tailored.resume);
    if (format === 'pdf' || format === 'docx') {
      assert.equal(content.filter((item) => item.type === 'resource').length, 1);
      const imported = (await call('import_resume_document', { format, contentBase64: bytes.toString('base64') })).result;
      for (const fact of [source.basics.name, source.work[0].name, '2023-06', '2025-12', 'TypeScript', 'Node.js', 'PostgreSQL', source.projects[0].name, source.education[0].institution]) {
        assert(imported.text.includes(fact), `Missing fact in ${format}: ${fact}`);
      }
      assert(!imported.text.includes('Should not be applied'));
      await writeFile(path.join(output, `reimport-${format}.json`), `${JSON.stringify(imported, null, 2)}\n`);
    }
    report.exports.push({ filename, format, bytes: result.bytes, sha256: result.sha256, pageCount: result.pageCount ?? null });
  }
  await call('import_resume_document', { format: 'pdf', contentBase64: Buffer.from('not a PDF').toString('base64') }, 'INVALID_DOCUMENT');
  assert.equal(stderr, '', 'Unexpected plugin stderr');
  report.match = { requirementsWithAllKeywords: 3, totalRequirements: 4, missingKeywords: ['Redis', 'Kubernetes'], missingSkillsAdded: false };
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = error.message;
  throw error;
} finally {
  await client.close();
  report.elapsedMilliseconds = Math.round(performance.now() - started);
  await writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, version, client: values.label, calls: report.steps.length, tools: report.tools.length, output, elapsedMilliseconds: report.elapsedMilliseconds }, null, 2));
}
