import test from 'node:test';
import assert from 'node:assert/strict';
import { exportDocument, previewDocument } from '../src/core/documents/export.js';
import { importDocument } from '../src/core/documents/import.js';
import { listTemplates } from '../src/core/themes/library.js';
import { readFile } from 'node:fs/promises';
import { renderPdf } from '../src/core/documents/render-pdf.js';
import { resumePhoto } from '../src/core/documents/photo.js';
import { foldedStyles } from '../src/core/documents/folded-styles.js';

test('folded template preserves supplied identity fields, extensions and section order', async () => {
  const resume = { basics: { name: '折角测试', label: '应用工程师', phone: '100-200-300', email: 'test@example.invalid', gender: '自填性别', age: 24, ethnicity: '自填民族', desiredLocation: '意向城市甲', expectedSalary: '面议', summary: '独立简介事实', custom: { note: '自定义事实' } }, education: [{ institution: '示例学院' }], skills: [{ name: 'TypeScript' }], work: [{ name: '示例公司', position: '工程师', highlights: ['工作事实'] }], projects: [{ name: '示例项目' }] };
  const before=JSON.stringify(resume);
  assert.equal(listTemplates({query:'蓝金折角'}).templates[0]?.id,'bluegold-classic');
  for(const locale of ['zh-CN','en'] as const){
    const preview=await previewDocument(resume,locale,'bluegold-classic');
    assert.equal(preview.pageCount,1);
    assert(preview.pages[0]!.svg.includes('<polygon'));
    assert(!preview.pages[0]!.svg.includes('<image'));
    for(const format of ['pdf','docx'] as const){
      const result=await exportDocument(resume,format,locale,'bluegold-classic');
      const imported=await importDocument(result.data,format);
      for(const fact of ['折角测试','自填性别','24','自填民族','意向城市甲','面议','独立简介事实','自定义事实','test@example.invalid','示例学院','TypeScript','示例公司','示例项目'])assert(imported.text.includes(fact),`${locale}/${format}: ${fact}`);
      if(format==='pdf'){
        assert(imported.text.indexOf('示例学院')<imported.text.indexOf('TypeScript'));
        assert(imported.text.indexOf('TypeScript')<imported.text.indexOf('示例公司'));
      }
    }
  }
  assert.equal(JSON.stringify(resume),before);
});

test('folded template does not invent optional personal fields or a photo', async () => {
  const minimal={basics:{name:'最少信息'}};
  const result=await exportDocument(minimal,'pdf','zh-CN','bluegold-classic');
  const imported=await importDocument(result.data,'pdf');
  for(const absent of ['性别','年龄','民族','期望薪资','求职意向'])assert(!imported.text.includes(absent));
  assert.equal(result.pageCount,1);
  const preview=await previewDocument(minimal,'zh-CN','bluegold-classic');
  assert(!preview.pages[0]!.svg.includes('<image'));
});

test('JPEG photos with a nonzero buffer offset export without corrupting the source bytes', async () => {
  const jpeg=await readFile(new URL('./fixtures/folded-photo.jpg',import.meta.url));
  const backing=Buffer.alloc(jpeg.length+32,0),offset=backing.subarray(16,16+jpeg.length);
  offset.set(jpeg);
  const photo=resumePhoto({basics:{image:`data:image/jpeg;base64,${jpeg.toString('base64')}`}})!;
  const result=await renderPdf([{kind:'title',text:'JPEG offset regression'}],'bluegold-classic','en',{...photo,data:offset});
  assert.equal(result.pageCount,1);
  assert(result.data.length>1000);
  assert.deepEqual(offset,jpeg);
  const resume={basics:{name:'JPEG fixture',image:photo.uri}};
  const preview=await previewDocument(resume,'en','bluegold-classic');
  assert(preview.pages[0]!.svg.includes('data:image/jpeg;base64,'));
  assert(!preview.omittedFields.includes('/basics/image'));
});

test('folded series is discoverable and supports every photo position without changing personal facts', async () => {
  const image='data:image/jpeg;base64,'+(await readFile(new URL('./fixtures/folded-photo.jpg',import.meta.url))).toString('base64');
  const source={basics:{name:'Series Example',label:'Application Engineer',image,email:'example@example.invalid',url:'https://example.invalid/portfolio/long-path-for-wrapping',gender:'Self supplied',desiredLocation:'Example City',expectedSalary:'Negotiable',custom:'Extension fact'},education:[{institution:'Example University'}],projects:[{name:'PROJECT FACT'}],work:[{name:'WORK FACT'}]};
  const before=JSON.stringify(source), found=listTemplates({query:'折角',limit:100}).templates;
  for(const style of foldedStyles){
    assert(found.some(template=>template.id===style.id));
    const preview=await previewDocument(source,'en',style.id);
    assert(preview.pages[0]!.svg.includes('<image'));
    assert.equal(preview.pageCount,1);
    for(const format of ['pdf','docx'] as const){
      const output=await exportDocument(source,format,'en',style.id);
      const imported=await importDocument(output.data,format);
      const text=imported.text.replace(/\s/gu,'');
      for(const fact of ['Series Example','example@example.invalid','Self supplied','Example City','Negotiable','Extension fact','Example University','PROJECT FACT','WORK FACT'])assert(text.includes(fact.replace(/\s/gu,'')),`${style.id}/${format}: ${fact}`);
      if(style.id==='folded-cobalt')assert(imported.text.indexOf('PROJECT FACT')<imported.text.indexOf('WORK FACT'));
    }
    const minimal=await previewDocument({basics:{name:'Minimal supplied facts'}},'en',style.id);
    assert(!minimal.pages[0]!.svg.includes('<image'));
    assert(!minimal.omittedFields.length);
  }
  assert.equal(JSON.stringify(source),before);
});
