export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_BASE64_CHARS = Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4;
export const MAX_DOCUMENT_TEXT = 100_000;
export const MAX_PDF_PAGES = 30;
export const DOCUMENT_MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;
export type DocumentFormat = keyof typeof DOCUMENT_MIME;
