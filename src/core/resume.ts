import { createHash } from 'node:crypto';
import { Ajv, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import schema from '@jsonresume/schema/schema.json' with { type: 'json' };

export type Resume = Record<string, unknown>;
export const MAX_RESUME_BYTES = 256 * 1024;
export const resumeSchema = schema;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats.default(ajv);
const validate = ajv.compile(schema);
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

export class ResumeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ResumeError';
  }
}

// Keep both recursive processing and tool responses bounded. No input is evaluated.
export function checkInput(value: unknown, depth = 0): void {
  if (depth > 20) throw new ResumeError('INPUT_TOO_DEEP', 'Resume nesting cannot exceed 20 levels.');
  if (Array.isArray(value)) {
    for (const item of value) checkInput(item, depth + 1);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) throw new ResumeError('UNSAFE_KEY', 'Reserved object keys are not supported.');
      checkInput(item, depth + 1);
    }
  }
}

export function assertBounded(value: unknown): void {
  checkInput(value);
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_RESUME_BYTES) {
    throw new ResumeError('INPUT_TOO_LARGE', 'Resume input exceeds 256 KiB.');
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export function revisionOf(resume: Resume): string {
  assertBounded(resume);
  return createHash('sha256').update(JSON.stringify(canonical(resume))).digest('hex');
}

export function inspectResume(resume: Resume) {
  assertBounded(resume);
  const valid = validate(resume);
  const errors = (validate.errors ?? []).map((error: ErrorObject) => ({
    path: error.instancePath || '/', keyword: error.keyword, message: error.message ?? 'Invalid value',
  }));
  const warnings: string[] = [];
  const basics = resume.basics as Record<string, unknown> | undefined;
  if (!basics?.name) warnings.push('A name is needed before using this as a finished resume.');
  if (!Array.isArray(resume.work) || resume.work.length === 0) warnings.push('No work history supplied; education or projects may be more relevant for early-career applicants.');
  return { valid: Boolean(valid), errors, warnings, revision: revisionOf(resume) };
}

export function assertResume(resume: Resume): void {
  const result = inspectResume(resume);
  if (!result.valid) throw new ResumeError('INVALID_RESUME', JSON.stringify(result.errors));
}

export function createResume(name: string, label?: string): Resume {
  return { basics: { name, ...(label ? { label } : {}) }, work: [], education: [], skills: [], projects: [] };
}
