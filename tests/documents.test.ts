import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { zipSync, unzipSync, strToU8 } from 'fflate';
import { exportDocument } from '../src/core/documents/export.js';
import { importDocument } from '../src/core/documents/import.js';
import { decodeDocument } from '../src/core/documents/bytes.js';
import { resumeLayout } from '../src/core/documents/layout.js';
import type { Resume } from '../src/core/resume.js';

const example: Resume = JSON.parse(await readFile(new URL('../examples/resume.layout.zh-CN.json', import.meta.url), 'utf8'));

test('PDF and DOCX preserve Chinese, English, dates, and extension facts on re-import', async () => {
  const source = { ...example, customFact: { detail: '扩展事实 ABC-123' }, meta: { note: 'not for print' } };
  const original = structuredClone(source);
  for (const format of ['pdf', 'docx'] as const) {
    const exported = await exportDocument(source, format);
    assert.equal(exported.sha256, createHash('sha256').update(exported.data).digest('hex'));
    assert.equal(exported.persisted, false);
    assert.deepEqual(exported.omittedFields, ['/meta']);
    const imported = await importDocument(exported.data, format);
    for (const fact of ['陈知远', 'TypeScript', '2023-06', '2025-12', '扩展事实 ABC-123']) assert(imported.text.includes(fact), `Missing ${fact} from ${format}`);
    assert(!imported.text.includes('not for print'));
    assert(imported.blocks.every((block) => format === 'pdf' ? block.page !== undefined : block.part !== undefined && block.paragraph !== undefined));
    assert(!('resume' in imported), 'Extraction must not fabricate structured facts');
  }
  assert.deepEqual(source, original);
});

test('long PDFs paginate and keep the first and last evidence without truncation', async () => {
  const long: Resume = { basics: { name: '分页演示' }, work: Array.from({ length: 9 }, (_, index) => ({
    name: `演示公司 ${index + 1}`, position: '工程师', startDate: '2020-01', endDate: '2021-01',
    highlights: Array.from({ length: 4 }, (_, row) => `记录 ${index + 1}-${row + 1}：使用 TypeScript 编写接口、补充测试并维护操作文档。`),
  })) };
  const exported = await exportDocument(long, 'pdf');
  assert(exported.pageCount! >= 2);
  const imported = await importDocument(exported.data, 'pdf');
  assert.equal(imported.pageCount, exported.pageCount);
  assert(imported.text.includes('记录 1-1'));
  assert(imported.text.includes('记录 9-4'));
  const loaded = await PDFDocument.load(exported.data);
  assert(loaded.getPages().every((page) => Math.abs(page.getWidth() - 595.28) < 0.01));
});

test('Word contains editable text, Chinese font settings, page geometry, and no external relationships', async () => {
  const exported = await exportDocument(example, 'docx');
  const entries = unzipSync(exported.data);
  const document = Buffer.from(entries['word/document.xml']!).toString('utf8');
  const styles = Buffer.from(entries['word/styles.xml']!).toString('utf8');
  assert(document.includes('陈知远'));
  assert(document.includes('w:w="11906"'));
  assert(styles.includes('Microsoft YaHei'));
  assert(document.includes('w:keepNext'));
  assert(!Object.entries(entries).filter(([name]) => name.endsWith('.rels')).some(([, data]) => Buffer.from(data).toString('utf8').includes('TargetMode="External"')));
});

test('bad base64, corrupt archives, DTD entities, and oversized expansion are rejected', async () => {
  for (const value of ['data:application/pdf;base64,AAAA', '!!!!', 'AB==', 'YQ']) assert.throws(() => decodeDocument(value));
  assert.deepEqual(decodeDocument('YQ=='), Buffer.from('a'));
  await assert.rejects(importDocument(Buffer.from('not a pdf'), 'pdf'), /header/u);
  await assert.rejects(importDocument(Buffer.from('PKnotazip'), 'docx'), /Unable to extract/u);
  const evil = Buffer.from(zipSync({ 'word/document.xml': strToU8('<!DOCTYPE root [<!ENTITY x "secret">]><root>&x;</root>') }));
  await assert.rejects(importDocument(evil, 'docx'), /type declarations/u);
  const large = Buffer.from(zipSync({ 'word/document.xml': strToU8('a'.repeat(2 * 1024 * 1024 + 1)) }));
  await assert.rejects(importDocument(large, 'docx'), /exceeds 2 MiB/u);
});

test('blank PDFs report OCR requirement and large page counts are rejected', async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  const imported = await importDocument(Buffer.from(await pdf.save()), 'pdf');
  assert.equal(imported.text, '');
  assert(imported.warnings.some((warning) => warning.includes('OCR')));
  for (let page = 1; page < 31; page++) pdf.addPage();
  await assert.rejects(importDocument(Buffer.from(await pdf.save()), 'pdf'), /30 pages/u);
});

test('tracked deletions and field instructions are not treated as current Word facts', async () => {
  const xml = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>保留事实</w:t></w:r><w:del><w:r><w:delText>删除事实</w:delText></w:r></w:del><w:r><w:instrText>INCLUDETEXT https://example.com/private</w:instrText></w:r></w:p></w:body></w:document>';
  const imported = await importDocument(Buffer.from(zipSync({ 'word/document.xml': strToU8(xml) })), 'docx');
  assert.equal(imported.text, '保留事实');
  assert(imported.warnings.some((warning) => warning.startsWith('TRACKED_CHANGES')));
});

test('English headings work, dates are not invented, and missing PDF glyphs fail explicitly', async () => {
  const layout = resumeLayout({ basics: { name: 'Example' }, work: [{ name: 'Company', startDate: '2024-01' }] }, 'en');
  assert(layout.blocks.some((block) => block.text === 'Experience'));
  assert(!layout.blocks.some((block) => block.text.includes('Present')));
  await assert.rejects(exportDocument({ basics: { name: 'Unsupported 🦄' } }, 'pdf'), /cannot render/u);
});
