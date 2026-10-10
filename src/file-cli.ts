import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runDocumentTask } from './core/documents/worker-client.js';
import { MAX_DOCUMENT_BYTES } from './core/documents/limits.js';
import { exportResume } from './core/export.js';
import { allTemplates, selectTemplate } from './core/themes/library.js';

async function boundedFile(filename: string, maxBytes: number) {
  const info = await stat(filename);
  if (!info.isFile() || info.size > maxBytes) throw new Error(`Expected a regular file of at most ${maxBytes} bytes.`);
  const data = await readFile(filename);
  if (data.length > maxBytes) throw new Error('The file grew beyond the input limit.');
  return data;
}

// Explicit file commands are a host-side bridge. MCP tools still accept and
// return data only, and cannot select arbitrary server filesystem paths.
export async function runFileCommand(args: string[]): Promise<boolean> {
  if (args.length === 1 && args[0] === 'templates') { process.stdout.write(`${JSON.stringify(allTemplates, null, 2)}\n`); return true; }
  if (!['import', 'export'].includes(args[0] ?? '')) return false;
  const [command, filename, ...flags] = args;
  if (!filename) throw new Error('A source filename is required. Run --help for examples.');
  if (command === 'import') {
    if (flags.length) throw new Error('Usage: import <resume.pdf|resume.docx>');
    const format = path.extname(filename).slice(1).toLowerCase();
    if (format !== 'pdf' && format !== 'docx') throw new Error('Import supports .pdf and .docx files.');
    const result = await runDocumentTask({ kind: 'import', data: await boundedFile(filename, MAX_DOCUMENT_BYTES), format });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return true;
  }
  const options = new Map<string, string>();
  let force = false;
  for (let index = 0; index < flags.length; index++) {
    const flag = flags[index]!;
    if (flag === '--force' && !force) { force = true; continue; }
    if (!['--out', '--format', '--locale', '--template'].includes(flag) || options.has(flag) || !flags[index + 1] || flags[index + 1]!.startsWith('--')) throw new Error('Invalid export options. Run --help for usage.');
    options.set(flag, flags[++index]!);
  }
  const output = options.get('--out');
  if (!output) throw new Error('Export requires --out <filename>.');
  if (path.resolve(output) === path.resolve(filename)) throw new Error('The output must differ from the source resume.');
  const format = options.get('--format') ?? path.extname(output).slice(1).toLowerCase();
  if (!['json', 'markdown', 'pdf', 'docx', 'html'].includes(format)) throw new Error('Export format must be json, markdown, pdf, docx, or html.');
  const locale = options.get('--locale') ?? 'zh-CN';
  if (locale !== 'zh-CN' && locale !== 'en') throw new Error('Locale must be zh-CN or en.');
  const resume = JSON.parse((await boundedFile(filename, 256 * 1024)).toString('utf8').replace(/^\uFEFF/u, ''));
  const exported = format === 'pdf' || format === 'docx' || format === 'html'
    ? await runDocumentTask({ kind: 'export', resume, format, locale, template: selectTemplate(options.get('--template')) })
    : exportResume(resume, format as 'json' | 'markdown');
  const data = 'data' in exported ? exported.data : exported.content;
  await writeFile(output, data, { flag: force ? 'w' : 'wx' });
  const { data: _data, content: _content, ...metadata } = exported as typeof exported & { data?: Buffer; content?: string };
  process.stdout.write(`${JSON.stringify({ ...metadata, savedTo: path.resolve(output), persisted: true }, null, 2)}\n`);
  return true;
}
