import { Worker } from 'node:worker_threads';
import type { Resume } from '../resume.js';
import { ResumeError } from '../resume.js';
import type { DocumentFormat } from './limits.js';
import type { Locale } from './layout.js';
import type { importDocument } from './import.js';
import type { exportDocument } from './export.js';
import type { previewDocument } from './export.js';

declare const SUPER_RESUME_WORKER_PATH: string | undefined;
export type DocumentTask = { kind: 'import'; data: Uint8Array; format: DocumentFormat } | { kind: 'export'; resume: Resume; format: DocumentFormat | 'html'; locale?: Locale; template?: string } | { kind: 'preview'; resume: Resume; locale?: Locale; template?: string };
let active = 0;
type DocumentResult = Awaited<ReturnType<typeof importDocument>> | Awaited<ReturnType<typeof exportDocument>> | Awaited<ReturnType<typeof previewDocument>>;

export function runDocumentTask(task: Extract<DocumentTask, { kind: 'import' }>): ReturnType<typeof importDocument>;
export function runDocumentTask(task: Extract<DocumentTask, { kind: 'export' }>): ReturnType<typeof exportDocument>;
export function runDocumentTask(task: Extract<DocumentTask, { kind: 'preview' }>): ReturnType<typeof previewDocument>;
export async function runDocumentTask(task: DocumentTask): Promise<DocumentResult> {
  if (active >= 2) throw new ResumeError('DOCUMENT_BUSY', 'Two document operations are already running. Retry after they finish.');
  active++;
  let worker: Worker | undefined;
  try {
    worker = new Worker(typeof SUPER_RESUME_WORKER_PATH !== 'undefined' ? SUPER_RESUME_WORKER_PATH : new URL('./worker.ts', import.meta.url), {
      workerData: task, resourceLimits: { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 32 },
      // Parser diagnostics must never corrupt the stdio MCP stream or echo resume data.
      stdout: true, stderr: true,
    });
    worker.stdout?.resume(); worker.stderr?.resume();
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new ResumeError('DOCUMENT_TIMEOUT', 'Document processing exceeded 30 seconds. Use a smaller or simpler document.')), 30_000);
      const cleanup = () => clearTimeout(timer);
      worker!.once('message', (response) => {
        cleanup();
        if (response.ok) {
          if (response.value.data) response.value.data = Buffer.from(response.value.data);
          resolve(response.value);
        } else reject(new ResumeError(response.code, response.message));
      });
      worker!.once('error', () => { cleanup(); reject(new ResumeError('DOCUMENT_WORKER_FAILED', 'The document worker failed or exceeded its memory budget.')); });
      worker!.once('exit', () => { cleanup(); reject(new ResumeError('DOCUMENT_WORKER_FAILED', 'The document worker exited before returning a result.')); });
    });
  } finally { if (worker) await worker.terminate(); active--; }
}
