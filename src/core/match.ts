import { assertResume, type Resume } from './resume.js';

export type JobRequirement = { text: string; keywords: string[] };
type Evidence = { path: string; excerpt: string };
const evidenceSections = new Set(['work', 'volunteer', 'education', 'awards', 'certificates', 'publications', 'skills', 'languages', 'projects']);
const excludedFields = new Set(['url', 'image', 'email', 'phone', 'startDate', 'endDate', 'date', 'id']);

function collectEvidence(resume: Resume): Evidence[] {
  const evidence: Evidence[] = [];
  function walk(value: unknown, path: string): void {
    if (typeof value === 'string' && value.trim()) evidence.push({ path, excerpt: value });
    else if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}/${index}`));
    else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (!excludedFields.has(key)) walk(item, `${path}/${key.replace(/~/gu, '~0').replace(/\//gu, '~1')}`);
      }
    }
  }
  const basics = resume.basics as Record<string, unknown> | undefined;
  if (basics) for (const key of ['label', 'summary']) walk(basics[key], `/basics/${key}`);
  for (const [key, value] of Object.entries(resume)) if (evidenceSections.has(key)) walk(value, `/${key}`);
  return evidence;
}

function findEvidence(source: Evidence[], keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const cjk = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(keyword);
  const pattern = new RegExp(cjk ? escaped : `(?<![\\p{L}\\p{N}_+#])${escaped}(?![\\p{L}\\p{N}_+#])`, 'iu');
  const matches: (Evidence & { startOffset: number; endOffset: number; truncated: boolean })[] = [];
  for (const item of source) {
    const match = pattern.exec(item.excerpt);
    if (!match) continue;
    const startOffset = Math.max(0, match.index - 150);
    const endOffset = Math.min(item.excerpt.length, startOffset + 600);
    matches.push({ path: item.path, excerpt: item.excerpt.slice(startOffset, endOffset), startOffset, endOffset, truncated: startOffset > 0 || endOffset < item.excerpt.length });
    if (matches.length === 3) break;
  }
  return matches;
}

export function matchJob(resume: Resume, requirements: JobRequirement[]) {
  assertResume(resume);
  const source = collectEvidence(resume);
  const results = requirements.map((requirement) => {
    const keywords = [...new Set(requirement.keywords.map((word) => word.trim()).filter(Boolean))];
    const matches = keywords.map((keyword) => ({ keyword, evidence: findEvidence(source, keyword) }));
    const missingKeywords = matches.filter((match) => !match.evidence.length).map((match) => match.keyword);
    const status = missingKeywords.length === 0 ? 'keywords_present' : missingKeywords.length === keywords.length ? 'no_keyword_evidence' : 'partial_keyword_evidence';
    return { requirement: requirement.text, status, matches, missingKeywords };
  });
  return {
    method: 'literal_keyword_evidence',
    results,
    summary: { total: results.length, allKeywordsPresent: results.filter((item) => item.status === 'keywords_present').length },
    limitations: 'Keyword presence is not proof of proficiency, years of experience, eligibility, truth, or hiring outcome. Negation and semantic equivalence are not evaluated. Excerpts are bounded to 600 UTF-16 code units, with offsets into the original field. Review the exact excerpts.',
  };
}
