import { assertResume, type Resume, ResumeError } from '../resume.js';

export type Locale = 'zh-CN' | 'en';
export type Block = { kind: 'title' | 'subtitle' | 'contact' | 'section' | 'entry' | 'detail' | 'body' | 'bullet'; text: string; section?: string; fields?: { key: string; value: string }[]; basicField?: string };
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown): string => typeof value === 'string' ? value.replace(/\r\n?/gu, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/gu, '').trim() : typeof value === 'number' ? String(value) : '';
const join = (values: unknown[], separator = ' | ') => values.map(text).filter(Boolean).join(separator);
const list = (value: unknown): string => Array.isArray(value) ? value.map(text).filter(Boolean).join(', ') : text(value);
const labels = {
  'zh-CN': { summary: '个人简介', work: '工作经历', education: '教育背景', projects: '项目经历', skills: '专业技能', certificates: '证书', languages: '语言能力', awards: '奖项', volunteer: '志愿经历', publications: '发表作品', interests: '兴趣', references: '推荐人', other: '其他信息' },
  en: { summary: 'Profile', work: 'Experience', education: 'Education', projects: 'Projects', skills: 'Skills', certificates: 'Certificates', languages: 'Languages', awards: 'Awards', volunteer: 'Volunteering', publications: 'Publications', interests: 'Interests', references: 'References', other: 'Additional information' },
};

export function resumeLayout(resume: Resume, locale: Locale = 'zh-CN') {
  assertResume(resume);
  const blocks: Block[] = [];
  const omittedFields: string[] = [];
  const add = (kind: Block['kind'], value: unknown, section?: string) => { const content = text(value); if (content) blocks.push({ kind, text: content, ...(section ? { section } : {}) }); };
  const basics = record(resume.basics);
  add('title', basics.name || (locale === 'zh-CN' ? '个人简历' : 'Resume'));
  add('subtitle', basics.label);
  const contactFields = ['email', 'phone', 'url'].flatMap(key => text(basics[key]) ? [{ key, value: text(basics[key]) }] : []);
  if (contactFields.length) blocks.push({ kind: 'contact', text: contactFields.map(f => f.value).join(' | '), fields: contactFields });
  const location = join(Object.values(record(basics.location)), ' ');
  if (location) blocks.push({ kind: 'contact', text: location, fields: [{ key: 'location', value: location }] });
  if (Array.isArray(basics.profiles)) for (const value of basics.profiles) {
    const profile = record(value);
    add('contact', join([profile.network, profile.username, profile.url]));
  }
  if (text(basics.summary)) { add('section', labels[locale].summary, 'summary'); add('body', basics.summary); }

  const extras = (object: RecordValue, known: string[], basic = false) => {
    function flatten(item: unknown, label: string, depth: number): void {
      if (Array.isArray(item)) {
        if (item.every((entry) => typeof entry === 'string' || typeof entry === 'number')) add('body', `${label}: ${list(item)}`);
        else item.forEach((entry, index) => flatten(entry, `${label} ${index + 1}`, depth + 1));
      } else if (item && typeof item === 'object') {
        for (const [key, child] of Object.entries(item)) flatten(child, label ? `${label} / ${key}` : key, depth + 1);
      } else if (text(item) || typeof item === 'boolean') add('body', `${label}: ${String(item)}`);
    }
    for (const [key, value] of Object.entries(object)) if (!known.includes(key)) {
      if (basic && ['gender', 'age', 'ethnicity', 'expectedSalary', 'desiredLocation'].includes(key) && text(value)) {
        blocks.push({ kind: 'body', text: `${key}: ${text(value)}`, basicField: key, fields: [{ key, value: text(value) }] });
      } else flatten(value, key, 0);
    }
  };
  if (basics.image) omittedFields.push('/basics/image');
  extras(basics, ['name', 'label', 'email', 'phone', 'url', 'location', 'profiles', 'summary', 'image'], true);
  extras(record(basics.location), Object.keys(record(basics.location)).filter((key) => typeof record(basics.location)[key] === 'string' || typeof record(basics.location)[key] === 'number'));
  if (Array.isArray(basics.profiles)) for (const profile of basics.profiles) extras(record(profile), ['network', 'username', 'url']);
  for (const key of ['work', 'projects', 'education', 'skills', 'certificates', 'languages', 'awards', 'volunteer', 'publications', 'interests', 'references'] as const) {
    const values = resume[key];
    if (!Array.isArray(values) || !values.length) continue;
    add('section', labels[locale][key], key);
    for (const value of values) {
      const item = record(value);
      const dates = join([item.startDate, item.endDate], ' - ');
      const handled = ['startDate', 'endDate', 'url', 'summary', 'highlights'];
      if (key === 'work' || key === 'volunteer') {
        add('entry', join([item.position, item.name, item.organization]));
        add('detail', join([dates, item.location]));
        handled.push('position', 'name', 'organization', 'location');
      } else if (key === 'education') {
        add('entry', join([item.institution, join([item.studyType, item.area], ' ')]));
        add('detail', dates);
        if (item.score) add('body', `${locale === 'zh-CN' ? '成绩' : 'Score'}: ${text(item.score)}`);
        add('body', list(item.courses));
        handled.push('institution', 'studyType', 'area', 'score', 'courses');
      } else if (key === 'skills' || key === 'interests' || key === 'languages') {
        add('entry', join([item.name, item.language, item.level, item.fluency]));
        add('body', list(item.keywords));
        handled.push('name', 'language', 'level', 'fluency', 'keywords');
      } else {
        add('entry', join([item.name, item.title, item.issuer, item.awarder, item.publisher, item.entity]));
        add('detail', join([dates, item.date ?? item.releaseDate, list(item.roles)]));
        add('body', item.description);
        add('body', item.reference);
        add('body', list(item.keywords));
        handled.push('name', 'title', 'issuer', 'awarder', 'publisher', 'entity', 'date', 'releaseDate', 'roles', 'description', 'reference', 'keywords');
      }
      add('detail', item.url);
      add('body', item.summary);
      if (Array.isArray(item.highlights)) for (const highlight of item.highlights) add('bullet', highlight);
      extras(item, handled);
    }
  }
  const known = ['basics', 'work', 'projects', 'education', 'skills', 'certificates', 'languages', 'awards', 'volunteer', 'publications', 'interests', 'references', '$schema', 'meta'];
  const extensionEntries = Object.entries(resume).filter(([key]) => !known.includes(key));
  if (extensionEntries.length) { add('section', labels[locale].other, 'other'); extras(Object.fromEntries(extensionEntries), []); }
  if (resume.meta) omittedFields.push('/meta');
  if (resume.$schema) omittedFields.push('/$schema');
  if (blocks.reduce((sum, block) => sum + block.text.length, 0) > 80_000) throw new ResumeError('DOCUMENT_TOO_LARGE', 'Formatted exports support at most 80,000 text characters. Use JSON for larger documents.');
  return { blocks, omittedFields };
}
