import { ResumeError } from '../resume.js';
import type { Block } from './layout.js';
import { designs } from './designs.js';
export const TEMPLATE_IDS = [...designs.map(d => d.id), 'modern', 'classic', 'timeline', 'editorial', 'campus', 'compact'] as const;
export type TemplateId = typeof TEMPLATE_IDS[number];
export const resumeTemplates = [
 ...designs.map(d => ({id:d.id,name:d.name,subtitle:d.subtitle,layout:`${d.header}-${d.body}-${d.section}`,accent:`#${d.accent}`,category:d.category,description:d.description,family:d.family,collection:'精选设计',specimen:d.specimen,showcasePhoto:d.photo!==false})),
 { id: 'modern', name: '曜石', subtitle: '深色侧栏 · 商务与管理', layout: 'dark-sidebar', accent: '#183D4B', category: '商务管理', description: '深海蓝侧栏收纳个人信息与技能，白色主栏突出经历和成果。适合商务、运营与管理岗位。' },
 { id: 'classic', name: '锋芒', subtitle: '对比色刊头 · 产品与运营', layout: 'contrast-header', accent: '#283534', category: '产品运营', description: '炭黑刊头与青柠色标记，姓名、求职方向和成果有明确的阅读顺序。适合产品与增长岗位。' },
 { id: 'timeline', name: '脉络', subtitle: '经历时间线 · 技术与工程', layout: 'timeline', accent: '#315BC6', category: '技术工程', description: '钴蓝时间线串联工作与项目，独立能力栏呈现技术栈。适合开发、数据与工程岗位。' },
 { id: 'editorial', name: '刊页', subtitle: '大字与编号 · 设计与创意', layout: 'editorial-rail', accent: '#BF543E', category: '设计创意', description: '杂志式姓名区、醒目的栏目编号，优先展示项目与作品链接。适合设计、内容与品牌岗位。' },
 { id: 'campus', name: '新芽', subtitle: '清新分区 · 应届与实习', layout: 'education-first', accent: '#2B6954', category: '应届实习', description: '鼠尾草绿信息区，教育与项目优先，技能和证书单独呈现。适合应届生与转行求职者。' },
 { id: 'compact', name: '格致', subtitle: '栏目色签 · 咨询与专业服务', layout: 'labeled-rail', accent: '#77384B', category: '专业服务', description: '酒红色栏目标签和横向经历分区，突出严谨的信息组织。适合咨询、财务和专业服务。' },
].map(t => ({ family:'基础版式',collection:'经典版式',specimen:'engineering',showcasePhoto:false,...t, kind: 'native', license: '项目自有', source: '', author: 'Super Resume', formats: ['pdf', 'docx', 'html'], paperSize: 'A4', supportsChinese: true }));
export const templateAccent = (id: TemplateId) => resumeTemplates.find(t => t.id === id)!.accent.slice(1);
export function templateId(value: unknown = 'modern'): TemplateId {
 if (!(TEMPLATE_IDS as readonly unknown[]).includes(value)) throw new ResumeError('UNKNOWN_TEMPLATE', `Choose a template from: ${TEMPLATE_IDS.join(', ')}.`);
 return value as TemplateId;
}
export function splitSections(blocks: Block[]) {
 const header: Block[] = [], sections: { id: string; heading: Block; blocks: Block[] }[] = [];
 for (const block of blocks) {
  if (block.kind === 'section') sections.push({ id: block.section ?? 'other', heading: block, blocks: [] });
  else if (sections.length) sections[sections.length - 1]!.blocks.push(block);
  else header.push(block);
 }
 return { header, sections };
}
export const sidebarSections = new Set(['skills', 'education', 'languages', 'certificates', 'interests']);

// Balance equal columns using whole sections, preserving their reading order.
export function balancedSections<T extends {heading:Block;blocks:Block[]}>(sections:T[]) {
 const weights=sections.map(s=>35+s.blocks.reduce((sum,b)=>{
  const units=[...b.text].reduce((n,ch)=>n+(ch.charCodeAt(0)<256?.55:1),0);
  return sum+Math.max(1,Math.ceil(units/23))*16+6;
 },0));
 let best=1,score=Infinity;
 for(let i=1;i<sections.length;i++){
  const a=weights.slice(0,i).reduce((n,v)=>n+v,0),b=weights.slice(i).reduce((n,v)=>n+v,0);
  if(Math.max(a,b)<score){score=Math.max(a,b);best=i;}
 }
 return sections.slice(best);
}
