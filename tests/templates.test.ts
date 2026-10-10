import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { exportDocument, previewDocument } from '../src/core/documents/export.js';
import { importDocument } from '../src/core/documents/import.js';
import { TEMPLATE_IDS } from '../src/core/documents/templates.js';
import type { Resume } from '../src/core/resume.js';

const example: Resume = JSON.parse(await readFile(new URL('../examples/resume.layout.zh-CN.json', import.meta.url), 'utf8'));
test('all 117 templates export the same facts and preview the PDF pagination without external assets', async () => {
  const snapshots = new Set<string>();
  for (const template of TEMPLATE_IDS) {
    const preview = await previewDocument(example, 'zh-CN', template);
    assert.equal(preview.template, template);
    snapshots.add(preview.pages[0]!.svg);
    assert(preview.pages.every((page) => page.svg.startsWith('<svg ') && page.svg.includes('viewBox="0 0 595.28 841.89"')));
    assert(preview.pages.every((page) => !/<script|<foreignObject|<image|(?:href|src)="https?:/u.test(page.svg)));
    for (const format of ['pdf', 'docx'] as const) {
      const exported = await exportDocument(example, format, 'zh-CN', template);
      assert.equal(exported.template, template);
      const imported = await importDocument(exported.data, format);
      for (const fact of ['陈知远', '星澜科技', '订单处理工作台', '明川大学', '2023-06', '2025-12', 'TypeScript', 'PostgreSQL']) assert(imported.text.includes(fact), `${template}/${format} lost ${fact}`);
      if (format === 'pdf') {
        assert.equal(exported.pageCount, preview.pageCount);
        assert.equal(imported.text.split('陈知远').length - 1, 1, 'Visual weight must not duplicate extracted text');
      }
    }
  }
  assert.equal(snapshots.size, 117, 'Templates must have distinct layouts');
});

test('preview treats resume text as data and rejects unknown templates', async () => {
  const preview = await previewDocument({ basics: { name: '<script>Example</script>' } }, 'en', 'modern');
  assert(!preview.pages[0]!.svg.includes('<script>'));
  assert(preview.pages[0]!.svg.includes('&lt;script&gt;'));
  await assert.rejects(exportDocument(example, 'pdf', 'en', 'unknown' as 'classic'), /choose an available template/u);
});

test('two-column and section-rail exports preserve long careers across pages', async () => {
  const resume: Resume = { basics: { name: '分页模板测试' }, skills: [{ name: '技能', keywords: ['TypeScript', 'SQL'] }], work: Array.from({ length: 9 }, (_, index) => ({
    name: `测试公司 ${index + 1}`, position: '工程师', startDate: '2020-01', endDate: '2021-01',
    highlights: Array.from({ length: 4 }, (_, row) => `经历 ${index + 1}-${row + 1}：编写 TypeScript 接口、集成测试与项目文档。`),
  })) };
  for (const template of ['modern', 'compact','mint-card','mono-editor','slate-ledger','lime-grid','navy-ribbon','sky-fresh','academic-ivy','story-milestone','tech-terminal','bluegold-classic','folded-navy','folded-jade','folded-wine','folded-slate','folded-sand','folded-cobalt','folded-ink','folded-silver','folded-ivy','folded-campus','folded-circuit','folded-peach','folded-press','folded-lilac','folded-vermilion','folded-track'] as const) {
    const pdf = await exportDocument(resume, 'pdf', 'zh-CN', template);
    const imported = await importDocument(pdf.data, 'pdf');
    assert(pdf.pageCount! > 1);
    for (let i = 1; i <= 9; i++) for (let row = 1; row <= 4; row++) assert(imported.text.includes(`经历 ${i}-${row}`));
    const preview = await previewDocument(resume, 'zh-CN', template);
    assert.equal(preview.pageCount, pdf.pageCount);
  }
});


