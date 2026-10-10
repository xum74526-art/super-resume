import { createHash } from 'node:crypto';
import { revisionOf, type Resume } from '../resume.js';
import { resumeLayout, type Locale } from './layout.js';
import { DOCUMENT_MIME, type DocumentFormat } from './limits.js';
import { templateId } from './templates.js';
import { renderPdf, renderPreview } from './render-pdf.js';
import { renderDocx } from './render-docx.js';
import { selectTemplate } from '../themes/library.js';
import { resumePhoto } from './photo.js';
import { ResumeError } from '../resume.js';

export async function exportDocument(resume: Resume, format: DocumentFormat | 'html', locale: Locale = 'zh-CN', selectedTemplate: string = 'classic') {
  selectTemplate(selectedTemplate);

  const template = templateId(selectedTemplate);
  const { blocks, omittedFields: omitted } = resumeLayout(resume, locale);
  const photo = resumePhoto(resume), omittedFields = photo ? omitted.filter(p => p !== '/basics/image') : omitted;
  if (format === 'html') {
    const preview = await renderPreview(blocks, template, locale, photo, true);
    const escape = (s: string) => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    const html = '<!doctype html><html lang="'+locale+'"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;; img-src data:; base-uri &apos;none&apos;"><title>'+escape(blocks[0]?.text??'Resume')+'</title><style>body{margin:0;background:#e8eaed}.page{width:210mm;max-width:100%;margin:24px auto;background:white}.page svg{display:block;width:100%;height:auto}@page{size:A4;margin:0}@media print{body{background:white}.page{margin:0;width:210mm;break-after:page}.page:last-child{break-after:auto}}</style></head><body>'+preview.pages.map(p=>'<div class="page">'+p.svg+'</div>').join('')+'</body></html>';
    const data=Buffer.from(html);
    return {format,mimeType:'text/html',suggestedFilename:'resume.html',bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),sourceRevision:revisionOf(resume),persisted:false,template,locale,pageCount:preview.pageCount,omittedFields,warnings:['HTML uses vector outlines for consistent offline display. Use PDF or DOCX for selectable text.'],data};
  }
  const rendered = format === 'pdf' ? await renderPdf(blocks, template, locale, photo) : { data: await renderDocx(blocks, locale, template, photo), pageCount: null };
  return {
    format, mimeType: DOCUMENT_MIME[format], suggestedFilename: `resume.${format}`,
    bytes: rendered.data.length, sha256: createHash('sha256').update(rendered.data).digest('hex'),
    sourceRevision: revisionOf(resume), persisted: false, template, locale,
    pageCount: rendered.pageCount, omittedFields,
    warnings: [
      ...(omittedFields.length ? ['Remote photo URLs and machine metadata are omitted from the print layout; they remain in JSON exports. See omittedFields.'] : []),
      ...(format === 'docx' ? ['DOCX uses Microsoft YaHei for Chinese and Arial for Latin text. Fonts are not embedded; pagination can vary across editors. Use the PDF for fixed layout.'] : []),
    ], data: rendered.data,
  };
}

export async function previewDocument(resume: Resume, locale: Locale = 'zh-CN', selectedTemplate: string = 'classic') {
  selectTemplate(selectedTemplate);

  const template = templateId(selectedTemplate);
  const { blocks, omittedFields: omitted } = resumeLayout(resume, locale);
  const photo = resumePhoto(resume), omittedFields = photo ? omitted.filter(p => p !== '/basics/image') : omitted;
  return { ...await renderPreview(blocks, template, locale, photo), sourceRevision: revisionOf(resume), omittedFields, persisted: false };
}
