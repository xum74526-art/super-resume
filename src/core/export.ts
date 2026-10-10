import { createHash } from 'node:crypto';
import { assertResume, revisionOf, type Resume } from './resume.js';

export type ExportFormat = 'json' | 'markdown';
export function exportResume(resume: Resume, format: ExportFormat) {
  assertResume(resume);
  const content = format === 'json' ? `${JSON.stringify(resume, null, 2)}\n` : toMarkdown(resume);
  return {
    format,
    mimeType: format === 'json' ? 'application/json' : 'text/markdown',
    suggestedFilename: `resume.${format === 'json' ? 'json' : 'md'}`,
    content,
    bytes: Buffer.byteLength(content, 'utf8'),
    sha256: createHash('sha256').update(content).digest('hex'),
    sourceRevision: revisionOf(resume),
    persisted: false,
  };
}

function safeText(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/([\\`*_[\]{}#|!])/gu, '\\$1').replace(/\r?\n/gu, ' ');
}

// Render every supplied field, including JSON Resume extensions, rather than silently
// dropping sections. Specialized layout/PDF renderers can implement a separate adapter.
function toMarkdown(resume: Resume): string {
  const basics = resume.basics as Record<string, unknown> | undefined;
  const title = typeof basics?.name === 'string' && basics.name ? safeText(basics.name) : 'Resume';
  const lines = [`# ${title}`, ''];
  function render(value: unknown, key: string, depth: number): void {
    const indent = '  '.repeat(depth);
    const label = safeText(key);
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      lines.push(`${indent}- **${label}**`);
      value.forEach((item, index) => render(item, String(index + 1), depth + 1));
    } else if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return;
      lines.push(`${indent}- **${label}**`);
      for (const [child, item] of entries) render(item, child, depth + 1);
    } else if (value !== undefined && value !== null && value !== '') {
      lines.push(`${indent}- **${label}**: ${safeText(String(value))}`);
    }
  }
  for (const [key, value] of Object.entries(resume)) {
    if (key === '$schema') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    lines.push(`## ${safeText(key)}`, '');
    if (Array.isArray(value)) value.forEach((item, index) => render(item, String(index + 1), 0));
    else if (value && typeof value === 'object') for (const [child, item] of Object.entries(value)) render(item, child, 0);
    else render(value, key, 0);
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}
