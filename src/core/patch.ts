import jsonPatch, { type Operation } from 'fast-json-patch';
import { assertBounded, assertResume, ResumeError, revisionOf, type Resume } from './resume.js';

export type ResumePatch = { op: 'add' | 'remove' | 'replace' | 'test'; path: string; value?: unknown };

export function patchResume(resume: Resume, expectedRevision: string, operations: ResumePatch[]) {
  assertResume(resume);
  assertBounded(operations);
  if (revisionOf(resume) !== expectedRevision) throw new ResumeError('REVISION_CONFLICT', 'The supplied resume differs from the revision you inspected. Inspect it again before editing.');
  if (!operations.length || operations.length > 100) throw new ResumeError('INVALID_PATCH', 'Supply between 1 and 100 operations.');
  for (const operation of operations) {
    if (!['add', 'remove', 'replace', 'test'].includes(operation.op) || !operation.path.startsWith('/')) {
      throw new ResumeError('INVALID_PATCH', 'Only add/remove/replace/test operations on non-root JSON Pointers are supported.');
    }
    if (operation.op !== 'remove' && !Object.hasOwn(operation, 'value')) throw new ResumeError('INVALID_PATCH', 'This operation requires a value.');
    if (/~(?![01])/u.test(operation.path)) throw new ResumeError('INVALID_PATCH', 'Invalid JSON Pointer escape.');
    const segments = operation.path.split('/').slice(1).map((part) => part.replace(/~1/gu, '/').replace(/~0/gu, '~'));
    if (segments.some((part) => ['__proto__', 'constructor', 'prototype'].includes(part))) throw new ResumeError('UNSAFE_PATH', 'Reserved object paths are not supported.');
  }
  let updated: Resume;
  try {
    updated = jsonPatch.applyPatch(structuredClone(resume), operations as Operation[], true, true, true).newDocument as Resume;
  } catch {
    throw new ResumeError('INVALID_PATCH', 'Patch validation failed. Check pointers, array indices, and test values.');
  }
  assertResume(updated);
  return { resume: updated, revision: revisionOf(updated), appliedOperations: operations.length, persisted: false };
}
