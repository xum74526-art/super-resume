import test from 'node:test';
import assert from 'node:assert/strict';
import { allTemplates, listTemplates, selectTemplate } from '../src/core/themes/library.js';
import { previewDocument, exportDocument } from '../src/core/documents/export.js';
import { resumePhoto } from '../src/core/documents/photo.js';
import example from '../examples/resume.layout.zh-CN.json' with {type:'json'};
import { designs } from '../src/core/documents/designs.js';

test('curated library searches categories, paginates and retires imported templates', () => {
 assert.equal(allTemplates.length,117);
 assert.equal(new Set(allTemplates.map(t=>t.id)).size,117);
 assert.equal(new Set(allTemplates.map(t=>t.name)).size,117);
 // A new name/colour must not inflate the composition count.
 assert.equal(new Set(designs.map(d=>[d.header,d.body,d.section].join('/'))).size,designs.length);
 assert.equal(listTemplates({kind:'community'}).total,0);
 assert(listTemplates({query:'设计',limit:100}).templates.some(t=>t.id==='editorial'));
 assert.equal(listTemplates({query:'几何撞色'}).total,4);
 assert.equal(new Set(allTemplates.map(t=>t.family)).size,17);
 for(const family of ['商务高管','瑞士国际','学术研究','校招青春','科技极客','作品提案','复古报刊','手账拼贴','新中式','时间叙事'])assert.equal(listTemplates({query:family}).total,7);
 const first=listTemplates({limit:3}),second=listTemplates({offset:3,limit:3});
 assert.equal(first.nextOffset,3);assert.equal(second.nextOffset,6);
 assert(!second.templates.some(t=>first.templates.some(a=>a.id===t.id)));
 assert.throws(()=>selectTemplate('community:awesome-html-01-minimalist'),/retired/);
 assert.throws(()=>selectTemplate('../../package.json'),/available template/);
});
test('HTML export contains every page and escapes arbitrary facts', async () => {
 const resume={...example,basics:{name:'<script>alert(1)</script>',summary:'Unique factual text'},customFact:'UNIQUE_FIELD_KEEP'};
 const before=JSON.stringify(resume),result=await exportDocument(resume,'html','zh-CN','editorial');
 assert.equal(result.mimeType,'text/html');
 assert(result.data.toString().includes('UNIQUE_FIELD_KEEP'));
 assert(!/<script|<iframe|onerror=|<foreignObject/.test(result.data.toString()));
 assert.equal(JSON.stringify(resume),before);
 const long={basics:{name:'多页 HTML'},work:Array.from({length:28},(_,i)=>({name:'公司 '+i,position:'工程师',highlights:['测试内容 '.repeat(30)]}))};
 const preview=await previewDocument(long,'zh-CN','timeline');
 const html=await exportDocument(long,'html','zh-CN','timeline');
 assert.equal((html.data.toString().match(/class="page"/g)||[]).length,html.pageCount);
 assert.equal(html.pageCount,preview.pageCount);assert(html.data.toString().includes('公司 27'));
});
test('optional embedded raster photos render while remote URLs and active markup never load', async () => {
 const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a51kAAAAASUVORK5CYII=';
 const resume={basics:{name:'照片测试',image}};
 assert(resumePhoto(resume));
 const preview=await previewDocument(resume,'zh-CN','modern');
 assert(preview.pages[0]!.svg.includes('<image href="data:image/png;base64,'));
 assert(!preview.omittedFields.includes('/basics/image'));
 for(const format of ['pdf','docx'] as const){const result=await exportDocument(resume,format,'zh-CN','modern');assert(result.bytes>1000);}
 assert.equal(resumePhoto({basics:{image:'https://example.invalid/photo.png'}}),undefined);
 assert.throws(()=>resumePhoto({basics:{image:'data:image/svg+xml;base64,PHN2Zz4='}}),/PNG/);
 assert.throws(()=>resumePhoto({basics:{image:'data:image/png;base64,'+'A'.repeat(64)}}),/读取照片/);
});
