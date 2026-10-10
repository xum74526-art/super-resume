import assert from 'node:assert/strict';
import path from 'node:path';
import { resolve, run } from '../lib.mjs';

// Input must be the rendered PDF of the fictional multipage DOCX fixture
// produced by generate-samples.mjs, not a PDF exported directly by our renderer.
const filename = process.argv[2];
assert(filename, 'Usage: node scripts/qa/verify-word-pagination.mjs RENDERED_WORD_PDF');
const imported = JSON.parse(run(process.execPath, [resolve('dist/cli.cjs'), 'import', path.resolve(filename)]));
assert(imported.pageCount >= 2, 'Expected the multipage fixture');
const pages = imported.blocks.map((block) => ({ page: block.page, text: block.text.replace(/\s/gu, '') }));
for (let company = 1; company <= 9; company++) {
  const header = pages.find((block) => block.text.includes(`演示公司${company}（虚构）`));
  assert(header, `Missing company ${company}`);
  if (company === 1) assert.equal(header.page, 1, 'The first page must contain experience, not only a detached header');
  for (let row = 1; row <= 4; row++) {
    const evidence = pages.find((block) => block.text.includes(`记录${company}-${row}：`));
    assert(evidence, `Missing evidence ${company}-${row}`);
    if (row === 1) assert.equal(header.page, evidence.page, `Company ${company} is separated from its first evidence by a page break`);
  }
}
console.log(`Rendered Word pagination passed: ${imported.pageCount} pages, all 9 entry headings stay with their first evidence, all 36 facts present. Inspect every PNG separately for visual defects.`);
