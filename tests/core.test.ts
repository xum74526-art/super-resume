import test from 'node:test';
import assert from 'node:assert/strict';
import { createResume, inspectResume, revisionOf, type Resume } from '../src/core/resume.js';
import { patchResume } from '../src/core/patch.js';
import { matchJob } from '../src/core/match.js';
import { exportResume } from '../src/core/export.js';

const resume: Resume = {
  basics: { name: '测试用户', label: '软件工程师', email: 'demo@example.com' },
  work: [{ name: '示例公司', position: '开发工程师', startDate: '2023-06', highlights: ['使用 TypeScript 和 Node.js 开发订单服务。', '参与数据分析与报表开发。'] }],
  skills: [{ name: 'JavaScript', keywords: ['TypeScript', 'Node.js', 'C++'] }],
};

test('canonical JSON Resume validation returns meaningful field errors', () => {
  assert.equal(inspectResume(resume).valid, true);
  const invalid = inspectResume({ basics: { name: 'Example', email: 'invalid-email' }, work: 'not an array' });
  assert.equal(invalid.valid, false);
  assert(invalid.errors.some((error) => error.path === '/work'));
  assert(inspectResume(createResume('Example')).warnings.length > 0);
});

test('revisions are independent of property insertion order', () => {
  assert.equal(revisionOf({ basics: { name: 'A', label: 'B' }, work: [] }), revisionOf({ work: [], basics: { label: 'B', name: 'A' } }));
  assert.notEqual(revisionOf(resume), revisionOf({ ...resume, projects: [] }));
});

test('patch is atomic, checks the supplied snapshot, and preserves unrelated facts', () => {
  const original = structuredClone(resume);
  const edited = patchResume(resume, revisionOf(resume), [{ op: 'replace', path: '/basics/label', value: '后端工程师' }]);
  assert.deepEqual(resume, original);
  assert.deepEqual(edited.resume.work, resume.work);
  assert.notEqual(edited.revision, revisionOf(resume));
  assert.equal(edited.persisted, false);
  assert.throws(() => patchResume(edited.resume, revisionOf(resume), [{ op: 'remove', path: '/skills' }]), /differs from the revision/u);
  assert.throws(() => patchResume(resume, revisionOf(resume), [
    { op: 'replace', path: '/basics/label', value: 'Must not leak into the original' },
    { op: 'test', path: '/basics/name', value: 'Wrong name' },
  ]), /Patch validation failed/u);
  assert.deepEqual(resume, original);
});

test('patch rejects invalid documents and object prototype paths', () => {
  assert.throws(() => patchResume(resume, revisionOf(resume), [{ op: 'replace', path: '/work', value: false }]), /Invalid value|must be array/u);
  assert.throws(() => patchResume(resume, revisionOf(resume), [{ op: 'add', path: '/__proto__/polluted', value: true }]), /Reserved object paths/u);
  assert.throws(() => inspectResume(JSON.parse('{"basics":{"name":"A"},"__proto__":{"polluted":true}}') as Resume), /Reserved object keys/u);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test('keyword evidence respects token boundaries, CJK, symbols, and source pointers', () => {
  const matched = matchJob(resume, [
    { text: 'Java backend', keywords: ['Java'] },
    { text: 'TypeScript and data analysis', keywords: ['typescript', '数据分析'] },
    { text: 'C++ development', keywords: ['C++'] },
    { text: 'Python', keywords: ['Python'] },
  ]);
  assert.equal(matched.results[0]?.status, 'no_keyword_evidence');
  assert.equal(matched.results[1]?.status, 'keywords_present');
  assert.equal(matched.results[2]?.status, 'keywords_present');
  const evidence = matched.results[1]?.matches[0]?.evidence[0];
  assert.equal(evidence?.path, '/work/0/highlights/0');
  assert.equal(evidence?.excerpt, '使用 TypeScript 和 Node.js 开发订单服务。');
  assert.match(matched.limitations, /Negation/u);
});

test('contact fields and opaque metadata are excluded from evidence', () => {
  const contactOnly = { basics: { name: 'Python', email: 'java@example.com' }, meta: { keyword: 'TypeScript' } };
  assert.equal(matchJob(contactOnly, [{ text: 'Python', keywords: ['Python', 'Java', 'TypeScript'] }]).results[0]?.status, 'no_keyword_evidence');
});

test('evidence excerpts stay bounded and identify the exact source slice around a late match', () => {
  const text = `${'Context '.repeat(2000)}TypeScript${' more'.repeat(1000)}`;
  const result = matchJob({ basics: { summary: text } }, [{ text: 'TypeScript', keywords: ['TypeScript'] }]);
  const evidence = result.results[0]?.matches[0]?.evidence[0];
  assert(evidence);
  assert(evidence.excerpt.length <= 600);
  assert(evidence.excerpt.includes('TypeScript'));
  assert.equal(evidence.excerpt, text.slice(evidence.startOffset, evidence.endOffset));
  assert.equal(evidence.truncated, true);
});

test('exports include custom fields, neutralize markup, and leave the source untouched', () => {
  const extended = { ...resume, basics: { name: '<script>alert(1)</script>' }, customSection: { achievement: '确切的经历' } };
  const json = exportResume(extended, 'json');
  assert.deepEqual(JSON.parse(json.content), extended);
  const markdown = exportResume(extended, 'markdown');
  assert(!markdown.content.includes('<script>'));
  assert(markdown.content.includes('确切的经历'));
  assert.equal(markdown.persisted, false);
  assert.equal(json.bytes, Buffer.byteLength(json.content));
});

test('large or excessively nested inputs fail predictably', () => {
  assert.throws(() => inspectResume({ basics: { name: 'A', summary: 'x'.repeat(300_000) } }), /256 KiB/u);
  let nested: Record<string, unknown> = {};
  for (let index = 0; index < 25; index++) nested = { next: nested };
  assert.throws(() => inspectResume(nested), /20 levels/u);
});
