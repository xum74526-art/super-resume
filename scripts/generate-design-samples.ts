import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {allTemplates} from '../src/core/themes/library.js';
import {templateSpecimen} from '../src/studio/specimens.js';
import {exportDocument} from '../src/core/documents/export.js';
const root=process.cwd(),version=JSON.parse(await readFile('package.json','utf8')).version;
const samples=path.join(root,'artifacts/samples',version),qa=path.join(root,'.cache/qa',version);
await mkdir(samples,{recursive:true});await mkdir(qa,{recursive:true});
const long={basics:{name:'分页演示（虚构）',label:'仅用于文档验收'},work:Array.from({length:9},(_,i)=>({name:`演示公司 ${i+1}（虚构）`,position:'工程师',startDate:'2020-01',endDate:'2021-01',highlights:Array.from({length:4},(_,j)=>`记录 ${i+1}-${j+1}：使用 TypeScript 编写接口、补充测试并维护操作文档。`)}))};
type CatalogRow={id:string;name:string;samplePdfPages?:number;longPdfPages?:number};
const selected=new Set(process.argv.slice(2));
for(const id of selected)if(!allTemplates.some(t=>t.id===id))throw new Error(`Unknown sample template: ${id}`);
const catalog:CatalogRow[]=selected.size?JSON.parse(await readFile(path.join(qa,'catalog.json'),'utf8')):[];
for(const template of allTemplates.filter(t=>!selected.size||selected.has(t.id))){
 const sample=templateSpecimen(template);
 await writeFile(path.join(samples,`${template.id}.json`),JSON.stringify(sample,null,2));
 const row:CatalogRow={id:template.id,name:template.name};
 for(const format of ['pdf','docx'] as const){
  const one=await exportDocument(sample,format,'zh-CN',template.id);
  await writeFile(path.join(samples,`resume-${template.id}.${format}`),one.data);
  const multi=await exportDocument(long,format,'zh-CN',template.id);
  await writeFile(path.join(qa,`multipage-${template.id}.${format}`),multi.data);
  if(format==='pdf'){row.samplePdfPages=one.pageCount;row.longPdfPages=multi.pageCount;}
 }
 const previous=catalog.findIndex(r=>r.id===row.id);if(previous>=0)catalog[previous]=row;else catalog.push(row);
 console.log(`${template.id}: sample ${row.samplePdfPages}p; long ${row.longPdfPages}p`);
}
await writeFile(path.join(qa,'catalog.json'),JSON.stringify(catalog,null,2));
await writeFile(path.join(qa,'resume-multipage.json'),JSON.stringify(long,null,2));
