import { resumeTemplates, templateId } from '../documents/templates.js';
import { ResumeError } from '../resume.js';
export const libraryStats = { curated: resumeTemplates.length, community: 0, native: resumeTemplates.length, total: resumeTemplates.length };
export const allTemplates = resumeTemplates;
export function selectTemplate(value: unknown = 'modern'): string {
 if (typeof value !== 'string' || !allTemplates.some(t => t.id === value)) throw new ResumeError('UNKNOWN_TEMPLATE', 'Use list_resume_templates to choose an available template ID. The old community library has been retired.');
 return value;
}
export function listTemplates(options: { query?: string; kind?: string; offset?: number; limit?: number } = {}) {
 const query = (options.query ?? '').trim().toLowerCase();
 const matches = allTemplates.filter(t => (!options.kind || options.kind === 'all' || t.kind === options.kind) && `${t.name} ${t.id} ${t.subtitle} ${t.description} ${t.category} ${t.family}`.toLowerCase().includes(query));
 const offset = Math.max(0, options.offset ?? 0), limit = Math.max(1, Math.min(100, options.limit ?? 20));
 return { templates: matches.slice(offset, offset + limit), total: matches.length, offset, limit, nextOffset: offset + limit < matches.length ? offset + limit : null, library: libraryStats, defaultTemplate: 'modern', recommendedTemplate: 'mint-card' };
}
export const nativeTemplate = (id: string) => templateId(id);
