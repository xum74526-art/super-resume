import { ResumeError, type Resume } from '../resume.js';
export type ResumePhoto = { data: Buffer; uri: string; type: 'png' | 'jpg'; width: number; height: number };
// Only embedded raster images: never fetch a resume URL or parse SVG markup.
export function resumePhoto(resume: Resume): ResumePhoto | undefined {
  const value = (resume.basics as Record<string, unknown> | undefined)?.image;
  if (typeof value !== 'string' || !value.startsWith('data:')) return;
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/u.exec(value);
  if (!match) throw new ResumeError('INVALID_PHOTO', '照片请使用嵌入的 PNG 或 JPEG，可在工作台重新上传。');
  const data = Buffer.from(match[2]!, 'base64');
  if (data.length > 160_000 || data.length < 24) throw new ResumeError('INVALID_PHOTO', '照片必须小于 160 KB，请在工作台重新上传以自动压缩。');
  let width = 0, height = 0;
  const type = match[1] === 'png' ? 'png' : 'jpg';
  if (type === 'png' && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    width = data.readUInt32BE(16); height = data.readUInt32BE(20);
  } else if (type === 'jpg' && data[0] === 255 && data[1] === 216) {
    let p = 2;
    while (p + 8 < data.length) {
      if (data[p] !== 255) break;
      const marker = data[p + 1]!; p += 2;
      if (marker === 216 || marker === 217) continue;
      const length = data.readUInt16BE(p);
      if (length < 2 || p + length > data.length) break;
      if ([192,193,194].includes(marker)) { height = data.readUInt16BE(p + 3); width = data.readUInt16BE(p + 5); break; }
      p += length;
    }
  }
  if (!width || !height || width > 2000 || height > 2000) throw new ResumeError('INVALID_PHOTO', '无法读取照片，或图片尺寸超过 2000 像素。');
  return { data, uri: value, type, width, height };
}
