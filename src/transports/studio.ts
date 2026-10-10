import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { runDocumentTask } from '../core/documents/worker-client.js';
import { allTemplates, libraryStats, selectTemplate } from '../core/themes/library.js';
import { assertResume, ResumeError, type Resume } from '../core/resume.js';
import { exportResume } from '../core/export.js';
import { specimens, specimenNames, templateSpecimen } from '../studio/specimens.js';
import { studioHtml, studioCss, studioJs } from '../studio/page.js';

const MAX_BODY = 512 * 1024;
function send(response: ServerResponse, status: number, contentType: string, data: string | Buffer) {
  response.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(data);
}
const json = (response: ServerResponse, status: number, value: unknown) => send(response, status, 'application/json; charset=utf-8', JSON.stringify(value));
async function bodyOf(request: IncomingMessage) {
  let bytes = 0; const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const data = Buffer.from(chunk); bytes += data.length;
    if (bytes > MAX_BODY) throw new ResumeError('INPUT_TOO_LARGE', '简历内容超过本地预览的大小限制。');
    chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

// A local companion to the plugin. No profile storage, filesystem routes,
// remote fonts, tracking, or network requests are made on behalf of a resume.
export function createStudioServer() {
  const thumbnails = new Map<string, Promise<string>>();
  let thumbnailQueue: Promise<unknown> = Promise.resolve();
  const server = createServer(async (request, response) => {
    const port = (server.address() as AddressInfo | null)?.port;
    if (request.headers.host !== `127.0.0.1:${port}`) return json(response, 403, { error: 'Host not allowed' });
    if (request.headers.origin && request.headers.origin !== `http://127.0.0.1:${port}`) return json(response, 403, { error: 'Origin not allowed' });
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; frame-src 'self' blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    response.setHeader('Referrer-Policy', 'no-referrer');
    if (request.method === 'GET') {
      if (request.url === '/') return send(response, 200, 'text/html; charset=utf-8', studioHtml);
      if (request.url === '/studio.css') return send(response, 200, 'text/css; charset=utf-8', studioCss);
      if (request.url === '/studio.js') return send(response, 200, 'text/javascript; charset=utf-8', studioJs);
      if (request.url === '/api/config') return json(response, 200, { templates: allTemplates, library: libraryStats, example:specimens.marketing, specimenNames });
      if (request.url?.startsWith('/api/sample?')) {
        const id=new URL(request.url,'http://127.0.0.1').searchParams.get('id')??'';
        if(!Object.hasOwn(specimens,id))return json(response,404,{error:'Sample unavailable'});
        return json(response,200,{resume:specimens[id]});
      }
      if (request.url?.startsWith('/api/template-thumbnail?')) {
        try {
          const id = selectTemplate(new URL(request.url, 'http://127.0.0.1').searchParams.get('id'));
          if (!thumbnails.has(id)) {
            const specimen=templateSpecimen(allTemplates.find(t=>t.id===id)!);
            const task = thumbnailQueue.then(async () => {const preview = await runDocumentTask({ kind: 'preview', resume: specimen, template: id, locale: 'zh-CN' }); return preview.pages[0]!.svg;});
            thumbnailQueue = task.catch(() => {thumbnails.delete(id);});
            thumbnails.set(id, task);
          }
          response.setHeader('Content-Security-Policy', "default-src 'none'; img-src data:; frame-ancestors 'self'; sandbox; base-uri 'none'; form-action 'none'");
          return send(response, 200, 'image/svg+xml; charset=utf-8', await thumbnails.get(id)!);
        } catch { return json(response, 404, { error: 'Preview unavailable' }); }
      }
      return json(response, 404, { error: 'Not found' });
    }
    if (request.method !== 'POST' || !['/api/preview', '/api/export', '/api/validate'].includes(request.url ?? '')) return json(response, 404, { error: 'Not found' });
    if (request.headers['x-super-resume'] !== 'local-studio') return json(response, 403, { error: 'Local studio header required' });
    if (!/^application\/json(?:;|$)/iu.test(request.headers['content-type'] ?? '')) return json(response, 415, { error: 'JSON body required' });
    if (Number(request.headers['content-length'] ?? 0) > MAX_BODY) return json(response, 413, { error: '简历内容过大。' });
    try {
      const body = await bodyOf(request);
      const resume = body.resume as Resume;
      assertResume(resume);
      const template = selectTemplate(body.template ?? 'modern');
      const locale = body.locale ?? 'zh-CN';
      if (locale !== 'zh-CN' && locale !== 'en') return json(response, 400, { error: '不支持的语言设置。' });
      if (request.url === '/api/validate') return json(response, 200, { valid: true });
      if (request.url === '/api/preview') return json(response, 200, await runDocumentTask({ kind: 'preview', resume, template, locale }));
      const format = body.format;
      if (format !== 'pdf' && format !== 'docx' && format !== 'json' && format !== 'html') return json(response, 400, { error: '导出格式必须是 PDF、Word、HTML 或 JSON。' });
      const result = format === 'json' ? exportResume(resume, 'json') : await runDocumentTask({ kind: 'export', resume, format, template, locale });
      response.setHeader('Content-Disposition', `attachment; filename="resume-${template}.${format}"`);
      return send(response, 200, result.mimeType, 'data' in result ? result.data : result.content);
    } catch (error) {
      const status = error instanceof ResumeError && error.code === 'INPUT_TOO_LARGE' ? 413 : error instanceof ResumeError && error.code === 'DOCUMENT_BUSY' ? 429 : 400;
      return json(response, status, { error: error instanceof ResumeError ? error.message : '无法读取简历，请检查填写内容。', code: error instanceof ResumeError ? error.code : 'INVALID_INPUT' });
    }
  });
  server.requestTimeout = 35_000; server.headersTimeout = 10_000;
  return server;
}
