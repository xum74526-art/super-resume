import { parentPort, workerData } from 'node:worker_threads';
import { importDocument } from './import.js';
import { exportDocument, previewDocument } from './export.js';
import { ResumeError } from '../resume.js';
import type { DocumentTask } from './worker-client.js';

const task = workerData as DocumentTask;
try {
  const value = task.kind === 'import'
    ? await importDocument(Buffer.from(task.data), task.format)
    : task.kind === 'preview' ? await previewDocument(task.resume, task.locale, task.template)
    : await exportDocument(task.resume, task.format, task.locale, task.template);
  parentPort?.postMessage({ ok: true, value });
} catch (error) {
  parentPort?.postMessage({ ok: false, code: error instanceof ResumeError ? error.code : 'PROCESSING_FAILED', message: error instanceof ResumeError ? error.message : 'Document processing failed. Check the format and size.' });
}
