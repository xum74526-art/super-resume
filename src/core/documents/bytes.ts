import { ResumeError } from '../resume.js';
import { MAX_BASE64_CHARS, MAX_DOCUMENT_BYTES } from './limits.js';

export function decodeDocument(base64: string): Buffer {
  if (!base64 || base64.length > MAX_BASE64_CHARS) throw new ResumeError('DOCUMENT_TOO_LARGE', 'Supply a document of at most 5 MiB as standard base64.');
  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(base64)) throw new ResumeError('INVALID_BASE64', 'Expected standard padded base64 without a data URL prefix or whitespace.');
  const data = Buffer.from(base64, 'base64');
  if (data.toString('base64') !== base64) throw new ResumeError('INVALID_BASE64', 'The base64 input is not canonical.');
  if (data.length > MAX_DOCUMENT_BYTES) throw new ResumeError('DOCUMENT_TOO_LARGE', 'Documents must be at most 5 MiB.');
  return data;
}
