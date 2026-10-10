import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { create as createFont } from 'fontkit';
import { PDFDocument, rgb, pushGraphicsState, popGraphicsState, setLineWidth, setStrokingColor, setTextRenderingMode, TextRenderingMode } from 'pdf-lib';
import { ResumeError } from '../resume.js';
import type { Block, Locale } from './layout.js';
import { splitSections, sidebarSections, balancedSections, templateAccent, type TemplateId } from './templates.js';
import type { ResumePhoto } from './photo.js';
import { MAX_PDF_PAGES } from './limits.js';
import { designFor, designOrder } from './designs.js';
import { foldedLayout } from './folded-layout.js';
import { foldedStyleFor, foldedHeaderPhoto } from './folded-styles.js';

declare const SUPER_RESUME_FONT_PATH: string | undefined;
const fontPath = typeof SUPER_RESUME_FONT_PATH !== 'undefined' ? SUPER_RESUME_FONT_PATH : new URL('../../../assets/fonts/NotoSansCJKsc-Regular.otf', import.meta.url);
const WIDTH = 595.28, HEIGHT = 841.89, TOP = 42, BOTTOM = 790;
type TextOp = { kind: 'text'; x: number; y: number; text: string; size: number; color: string; bold?: boolean };
type ShapeOp = { kind: 'rect'; x: number; y: number; width: number; height: number; color: string };
type ImageOp = { kind: 'image'; x: number; y: number; width: number; height: number; photo: ResumePhoto };
type EllipseOp = { kind: 'ellipse'; x: number; y: number; width: number; height: number; color: string };
type PolygonOp = { kind: 'polygon'; points: [number, number][]; color: string };
type Op = TextOp | ShapeOp | ImageOp | EllipseOp | PolygonOp;
type Position = { page: number; y: number };
const xml = (text: string) => text.replace(/[&<>"']/gu, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
const n = (value: number) => Number(value.toFixed(6));

export function blockStyle(kind: Block['kind'], template: TemplateId, narrow = false) {
  const design=designFor(template);
  if (design?.section === 'folded') return {
    title: { size: 30, line: 38, before: 0, after: 5 },
    subtitle: { size: 10.5, line: 17, before: 0, after: 3 },
    contact: { size: 9.5, line: 15, before: 0, after: 3 },
    section: { size: 11, line: 18, before: 5, after: 4 },
    entry: { size: 10, line: 15, before: 3, after: 2 },
    detail: { size: 8.5, line: 12, before: 0, after: 2 },
    body: { size: 9.5, line: 13.5, before: 0, after: 2.5 },
    bullet: { size: 9.5, line: 13.5, before: 0, after: 2.5 },
  }[kind];
  if(design){
    const base={title:{size:design.titleSize??30,line:(design.titleSize??30)+9,before:0,after:7},subtitle:{size:11.5,line:19,before:0,after:7},contact:{size:8.4,line:14,before:0,after:2},section:{size:11,line:18,before:11,after:8},entry:{size:10.2,line:17,before:4,after:3},detail:{size:8.3,line:13,before:0,after:3},body:{size:10,line:16.3,before:0,after:4},bullet:{size:10,line:16.3,before:0,after:4}}[kind];
    // Continuous reading layouts tighten spacing without reducing type size.
    if(['sequential','chronicle'].includes(design.body)){
      if(kind==='section'){base.before=7;base.after=6;}
      if(kind==='entry'){base.before=3;base.after=2;base.line=16;}
      if(kind==='detail')base.after=2;
      if(kind==='body'||kind==='bullet'){base.line=15.5;base.after=3;}
    }
    const scale=narrow?.86:1;
    return {size:base.size*scale,line:base.line*scale,before:base.before*(narrow?.8:1),after:base.after};
  }
  const dense = template === 'compact';
  const scale = narrow ? 0.9 : 1;
  const base = {
    title: { size: template === 'editorial' ? 36 : 29, line: 42, before: 0, after: 7 },
    subtitle: { size: 11, line: 19, before: 0, after: 7 },
    contact: { size: 8.5, line: 14, before: 0, after: 1 },
    section: { size: 11, line: 19, before: 17, after: 9 },
    entry: { size: 10, line: 16, before: 5, after: 2 },
    detail: { size: 8.2, line: 13, before: 0, after: 3 },
    body: { size: 9.3, line: 15.5, before: 0, after: 4 },
    bullet: { size: 9.3, line: 15.5, before: 0, after: 4 },
  }[kind];
  const factor = (dense && !['title', 'subtitle'].includes(kind) ? 0.94 : 1) * scale;
  return { size: base.size * factor, line: base.line * factor, before: base.before * (dense ? 0.7 : 1), after: base.after * (dense ? 0.8 : 1) };
}

// Both PDF and on-screen SVG are drawn from this same pagination plan. Preview
// glyph outlines are self-contained: they need neither a PDF viewer nor fonts.
async function prepare(blocks: Block[], template: TemplateId, locale: Locale, photo?: ResumePhoto) {
  const design=designFor(template), accent=templateAccent(template);
  const palette:Record<string,string>={[template]:accent};
  const bytes = await readFile(fontPath);
  const font = createFont(bytes);
  if (!('createSubset' in font)) throw new Error('A single font face is required.');
  const missing = [...new Set(blocks.flatMap((block) => [...block.text]).filter((char) => !/\s/u.test(char) && !font.hasGlyphForCodePoint(char.codePointAt(0)!)))];
  if (missing.length) throw new ResumeError('UNSUPPORTED_GLYPHS', `The bundled font cannot render: ${missing.slice(0, 12).join(' ')}. Use DOCX or explicitly revise these characters; no text was silently replaced.`);
  const measure = (text: string, size: number) => font.layout(text).positions.reduce((sum, pos) => sum + pos.xAdvance, 0) * size / font.unitsPerEm;
  const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  function wrap(text: string, size: number, width: number) {
    const lines: string[] = []; let line = '';
    const emit = () => { lines.push(line.trimEnd()); line = ''; };
    for (const token of text.match(/[A-Za-z0-9_%,+@.\/-]+|[^\S\n]+|[^A-Za-z0-9_%,+@.\/-]/gu) ?? []) {
      if (token === '\n') { emit(); continue; }
      if (!line && !token.trim()) continue;
      if (measure(line + token, size) <= width) { line += token; continue; }
      // CJK closing punctuation belongs with the preceding character, never at
      // the beginning of a new line by itself.
      if(line&&/^[，。！？；：、）】》」』]/u.test(token)){
        const units=[...graphemes.segment(line)].map(s=>s.segment),tail=units.pop()??'';
        line=units.join('');if(line)emit();line=tail+token;continue;
      }
      if (line) emit();
      if (!token.trim()) continue;
      if (measure(token, size) <= width) { line = token; continue; }
      for (const { segment } of graphemes.segment(token)) {
        if (line && measure(line + segment, size) > width) emit();
        line += segment;
      }
    }
    if (line) emit();
    return lines.length ? lines : [''];
  }
  const pages: Op[][] = [];
  const spines: ShapeOp[] = [];
  const sectionNumbers=new Map<string,number>();
  function page(index: number) {
    if (index >= MAX_PDF_PAGES) throw new ResumeError('DOCUMENT_TOO_LARGE', 'The formatted resume exceeds 30 pages.');
    while (pages.length <= index) {
      const background: Op[] = [];
      if(design){
        if(design.paper)background.push({kind:'rect',x:0,y:0,width:WIDTH,height:HEIGHT,color:design.paper});
        if (design.section === 'folded') {
          const spine: ShapeOp = { kind: 'rect', x: 41, y: pages.length ? TOP : 95, width: .8, height: 0, color: accent };
          background.push(spine); spines.push(spine);
        }
        const sw=design.sideWidth??180;
        if(design.body==='sidebar-left'||design.body==='sidebar-right')background.push({kind:'rect',x:design.body==='sidebar-left'?0:WIDTH-sw,y:0,width:sw,height:HEIGHT,color:design.accent});
        if(design.id==='blueprint'||design.id==='sage-garden'){
          for(const x of [22,WIDTH-23])background.push({kind:'rect',x,y:22,width:1,height:HEIGHT-44,color:design.secondary});
          for(const y of [22,HEIGHT-23])background.push({kind:'rect',x:22,y,width:WIDTH-44,height:1,color:design.secondary});
        }
        if(design.header==='swiss')background.push({kind:'rect',x:0,y:0,width:10,height:HEIGHT,color:design.accent});
        if(design.header==='han'){
          for(const x of [21,WIDTH-22])background.push({kind:'rect',x,y:22,width:.65,height:HEIGHT-44,color:design.secondary});
          for(const y of [22,HEIGHT-22])background.push({kind:'rect',x:21,y,width:WIDTH-43,height:.65,color:design.secondary});
        }
        if(design.header==='collage')for(let y=36;y<HEIGHT-30;y+=35)background.push({kind:'ellipse',x:12,y,width:6,height:6,color:design.secondary});
      }
      if (template === 'modern') background.push({ kind: 'rect', x: 0, y: 0, width: 185, height: HEIGHT, color: '183D4B' });
      if (template === 'timeline') background.push({ kind: 'rect', x: 421, y: 0, width: WIDTH - 421, height: HEIGHT, color: 'F0F4FC' });
      if (template === 'editorial') background.push({ kind: 'rect', x: 0, y: 0, width: 12, height: HEIGHT, color: 'BF543E' });
      if(!design)background.push({ kind: 'rect', x: template === 'modern' ? 185 : 0, y: 0, width: WIDTH, height: 6, color: palette[template]! });
      pages.push(background);
    }
    return pages[index]!;
  }
  const next = (position: Position) => { position.page++; position.y = TOP; page(position.page); };
  function flow(input: Block[], position: Position, x: number, width: number, narrow = false, centered = false, ink?: string) {
    const prepared = input.map((block) => {
      const style = blockStyle(block.kind, template, narrow);
      const inset=block.kind==='bullet'?10:block.kind==='section'&&design?(({number:30,icon:18,box:8,band:6,tab:6} as Record<string,number>)[design.section]??0):0;
      return { ...block, style, lines: wrap(block.text, style.size, width-inset) };
    });
    for (let index = 0; index < prepared.length; index++) {
      const block = prepared[index]!, m = block.style;
      let keep = m.before + m.line * block.lines.length + m.after;
      if (['section', 'entry', 'detail'].includes(block.kind)) {
        for (let j = index + 1; j < prepared.length; j++) {
          const following = prepared[j]!;
          if (j > index + 1 && ['section', 'entry'].includes(following.kind)) break;
          keep += following.style.before + following.style.line * (['entry', 'detail'].includes(following.kind) ? following.lines.length : 1) + following.style.after;
          if (!['entry', 'detail'].includes(following.kind)) break;
        }
      }
      if (position.y > TOP && position.y + Math.min(keep, BOTTOM - TOP) > BOTTOM) next(position);
      position.y += m.before;
      let sectionIndent=0,sectionInk:string|undefined;
      if(design&&block.kind==='section'){
        const ops=page(position.page),color=ink?'FFFFFF':accent;
        const rect=(rx:number,ry:number,rw:number,rh:number,fill:string)=>ops.push({kind:'rect',x:rx,y:ry,width:rw,height:rh,color:fill});
        if (design.section === 'folded') {
          const appearance=foldedStyleFor(design.id);
          const left = x - 22, top = position.y - 3, height = 17;
          const end = left + Math.max(74, measure(block.text, m.size) + 25);
          const poly=(points:[number,number][],color:string)=>ops.push({kind:'polygon',points,color});
          if(appearance.tag==='double')poly([[left+4,top-3],[end+8,top-3],[end+22,top+height-3],[left+4,top+height-3]],design.secondary);
          if(appearance.tag==='chevron')poly([[left,top],[end+5,top],[end+18,top+height/2],[end+5,top+height],[left,top+height],[left+6,top+height/2]],accent);
          else if(appearance.tag==='notch')poly([[left,top],[end+17,top],[end+8,top+height/2],[end+17,top+height],[left,top+height]],accent);
          else if(appearance.tag==='flag')poly([[left,top],[end+10,top],[end+3,top+height],[left,top+height]],accent);
          else if(appearance.tag==='ticket')poly([[left,top],[end+16,top],[end+16,top+5],[end+11,top+8.5],[end+16,top+12],[end+16,top+height],[left,top+height],[left+4,top+8.5]],accent);
          else if(appearance.tag==='step')poly([[left,top],[end+7,top],[end+7,top+6],[end+15,top+6],[end+15,top+height],[left,top+height]],accent);
          else poly([[left,top],[end,top],[end+17,top+height],[left,top+height]],accent);
          if(['outline','edge'].includes(appearance.tag))poly([[left+1,top+1],[end-.5,top+1],[end+14.5,top+height-1],[left+1,top+height-1]],appearance.paper);
          if(appearance.tag==='edge')rect(left,top,5,height,accent);
          if(appearance.tag==='step')rect(end+7,top,8,3,design.secondary);
          if(appearance.tag==='slash')for (const offset of [3, 8]) poly([[end-offset,top],[end-offset-1.3,top],[end+height-offset-1.3,top+height],[end+height-offset,top+height]],'FFFFFF');
          if(appearance.tag==='bookmark')rect(left+3,top+3,2,11,design.secondary);
          if(appearance.tag==='flag')rect(left+4,top+3,3,11,design.secondary);
          poly([[left,top+height],[left+10,top+height],[left+10,top+height+5]],appearance.id==='bluegold-classic'?'365765':design.secondary);
          rect(x-12, top+height, width+12, .6, accent);
          sectionInk=['outline','edge'].includes(appearance.tag)?accent:'FFFFFF';sectionIndent=-7;
        } else if(design.section==='band'||design.section==='tab'){
          rect(x-5,position.y-4,design.section==='band'?width+10:Math.min(width+10,115),24,ink?'FFFFFF':accent);sectionInk=ink?accent:'FFFFFF';sectionIndent=3;
        }else if(design.section==='box'){
          const c=ink?'99AFAB':design.secondary;
          rect(x-6,position.y-5,width+12,.8,c);rect(x-6,position.y+21,width+12,.8,c);rect(x-6,position.y-5,.8,26,c);rect(x+width+5,position.y-5,.8,26,c);sectionIndent=4;
        }else if(design.section==='number'){
          const serial=sectionNumbers.get(block.section??'other')??1;
          ops.push({kind:'text',x,y:position.y+12,text:String(serial).padStart(2,'0'),size:19,color,bold:true});sectionIndent=30;
        }else if(design.section==='icon'){
          ops.push({kind:'ellipse',x,y:position.y+2,width:10,height:10,color});sectionIndent=18;
        }else if(design.section==='marker'){rect(x-8,position.y-2,3,20,color);}
      }
      for (let line = 0; line < block.lines.length; line++) {
        if (position.y + m.line > BOTTOM) next(position);
        const text = block.lines[line]!;
        const color = sectionInk??(ink ? (['detail','contact'].includes(block.kind) ? 'D0DFE3' : ink) : block.kind === 'section' || block.kind === 'subtitle' ? palette[template]! : ['detail', 'contact'].includes(block.kind) ? '657078' : '26333B');
        if (template === 'timeline' && !narrow && block.kind === 'entry' && line === 0) page(position.page).push({kind:'rect',x:x-13,y:position.y+4,width:5,height:5,color:palette[template]!});
        if(template==='timeline'&&!narrow&&block.kind!=='section') page(position.page).push({kind:'rect',x:x-11,y:position.y+10,width:.7,height:m.line,color:'CED9F4'});
        if(design?.body==='chronicle'&&['entry','detail','body','bullet'].includes(block.kind)){
          page(position.page).push({kind:'rect',x:x-12,y:position.y,width:1,height:m.line,color:design.secondary});
          if(block.kind==='entry'&&line===0)page(position.page).push({kind:'ellipse',x:x-15,y:position.y+4,width:7,height:7,color:accent});
        }
        const indent = block.kind === 'bullet' ? 10 : sectionIndent;
        const px = centered ? x + Math.max(0, (width - measure(text, m.size)) / 2) : x + indent;
        if (block.kind === 'bullet' && line === 0) page(position.page).push({ kind: 'text', x, y: position.y + m.size, text: '•', size: m.size, color: ink ?? palette[template]! });
        page(position.page).push({ kind: 'text', x: px, y: position.y + m.size, text, size: m.size, color, bold: ['title', 'section', 'entry'].includes(block.kind) });
        position.y += m.line;
      }
      if (block.kind === 'section' && !design) {
        page(position.page).push({ kind: 'rect', x, y: position.y + 1, width, height: 0.65, color: ink ? '5A7883' : 'D9E0E5' });
        page(position.page).push({ kind: 'rect', x, y: position.y + 1, width: 26, height: 2, color: ink ? 'A5D6C6' : palette[template]! });
      }
      if(block.kind==='section'&&design&&['line','double','number','icon'].includes(design.section)){
        page(position.page).push({kind:'rect',x,y:position.y+1,width,height:.6,color:ink?'94AFAB':design.secondary});
        if(design.section==='double')page(position.page).push({kind:'rect',x,y:position.y+4,width,height:.6,color:ink?'94AFAB':design.secondary});
      }
      position.y += m.after;
    }
    return position;
  }
  const { header, sections } = splitSections(blocks);
  const rank = (order:string[],id:string) => order.includes(id) ? order.indexOf(id) : 99;
  const flat = (items: typeof sections) => items.flatMap(s => [s.heading, ...s.blocks]);
  function picture(x: number, y: number, width = 66, height = 83) {
    if (!photo) return;
    const scale = Math.min(width/photo.width,height/photo.height);
    page(0).push({kind:'image',x:x+(width-photo.width*scale)/2,y,width:photo.width*scale,height:photo.height*scale,photo});
  }
  if (design) {
    const d=design, margin=40, wide=WIDTH-margin*2;
    const rect=(x:number,y:number,width:number,height:number,color:string,p=0)=>{const op:ShapeOp={kind:'rect',x,y,width,height,color};page(p).push(op);return op;};
    const ellipse=(x:number,y:number,width:number,height:number,color:string)=>page(0).push({kind:'ellipse',x,y,width,height,color});
    const label=(text:string,x:number,y:number,size=9,color=accent)=>page(0).push({kind:'text',x,y,text,size,color});
    const ordered=[...sections].sort((a,b)=>rank(designOrder(d),a.id)-rank(designOrder(d),b.id));
    const sideIds=new Set(['skills','certificates','languages','awards','interests',...(['campus','academic'].includes(d.specimen)?[]:['education'])]);
    const sides=ordered.filter(s=>sideIds.has(s.id)), main=ordered.filter(s=>!sideIds.has(s.id));
    (['full','rail'].includes(d.body)?[...main,...sides]:ordered).forEach((s,i)=>sectionNumbers.set(s.id,i+1));
    if (d.section === 'folded') {
      const appearance=foldedStyleFor(d.id);
      const info = foldedLayout(blocks, locale), bx = 53, bw = WIDTH - bx - 31;
      const title=locale==='en'?'RESUME':'个人简历';
      const poly=(points:[number,number][],color:string)=>page(0).push({kind:'polygon',points,color});
      if(d.header==='ribbon'){
        rect(0,0,WIDTH,84,accent);poly([[0,84],[WIDTH-110,84],[WIDTH-96,95],[0,95]],d.secondary);
        label(title,43,57,32,'FFFFFF');label('PERSONAL RESUME',WIDTH-237,45,15,'FFFFFF');
        label(locale==='en'?'EXPERIENCE / SKILLS / EDUCATION':'教育 · 技能 · 经历',WIDTH-237,66,9,d.secondary);
      }else if(d.header==='frame'){
        rect(30,20,WIDTH-60,65,d.tint);rect(30,20,7,65,accent);rect(37,20,WIDTH-67,.8,d.secondary);
        label(title,55,57,29);label('PERSONAL RESUME',265,43,11);
        label(locale==='en'?'CAREER PROFILE':'个人履历 / 求职档案',265,65,12);
        poly([[WIDTH-90,20],[WIDTH-30,20],[WIDTH-30,80]],d.secondary);
      }else if(d.header==='ledger'){
        rect(40,22,WIDTH-80,1.5,accent);rect(40,27,WIDTH-80,.6,d.secondary);
        label(title,(WIDTH-measure(title,30))/2,59,30);label('PERSONAL RESUME',(WIDTH-measure('PERSONAL RESUME',10))/2,78,10);
        rect(40,88,WIDTH-80,.8,accent);
      }else if(d.header==='masthead'){
        label('CAREER PROFILE',43,35,9);label(title,43,70,31);
        label('Personal resume',43,93,15,d.secondary);rect(41,108,WIDTH-72,1,accent);rect(41,108,130,3,d.secondary);
      }else if(d.header==='center'){
        label(title,(WIDTH-measure(title,30))/2,53,30);
        label('PERSONAL RESUME',(WIDTH-measure('PERSONAL RESUME',11))/2,74,11);
        for(const x of [42,WIDTH-174])rect(x,59,132,.7,d.secondary);
        poly([[WIDTH/2,83],[WIDTH/2+4,87],[WIDTH/2,91],[WIDTH/2-4,87]],accent);
      }else if(d.header==='corner'){
        poly([[0,0],[WIDTH-147,0],[WIDTH-94,111],[0,111]],accent);
        poly([[WIDTH-130,0],[WIDTH,0],[WIDTH,111],[WIDTH-79,111]],d.tint);
        rect(0,105,280,6,d.secondary);label(title,45,58,32,'FFFFFF');label('PERSONAL RESUME',46,83,12,'FFFFFF');
      }else if(d.header==='executive'){
        rect(31,21,WIDTH-62,77,accent);rect(31,21,5,77,d.secondary);
        rect(WIDTH-207,21,176,77,d.tint);rect(31,98,WIDTH-62,2,d.secondary);
        label(title,51,60,30,'FFFFFF');label('PERSONAL RESUME',52,82,11,d.secondary);
        label('CAREER / PROFILE',WIDTH-191,50,10);label(locale==='en'?'EXPERIENCE & SKILLS':'工作经历 / 专业能力',WIDTH-191,74,11);
      }else if(d.header==='swiss'){
        rect(31,20,5,90,accent);rect(WIDTH-47,20,15,90,d.tint);
        const tx=photo?137:55;
        rect(tx,25,26,15,accent);label('CV',tx+5,36,9,'FFFFFF');
        label(title,tx,73,30);label('PERSONAL RESUME / PROFILE',tx,96,10);
        rect(31,110,WIDTH-62,.8,d.secondary);
      }else if(d.header==='academic'){
        for(const y of [21,96])rect(35,y,WIDTH-70,.7,d.secondary);
        for(const x of [35,WIDTH-36])rect(x,21,1,75,accent);
        rect(35,21,48,3,accent);rect(WIDTH-83,94,48,3,accent);
        label(title,(WIDTH-measure(title,30))/2,62,30);
        label('PERSONAL RECORD',(WIDTH-measure('PERSONAL RECORD',10))/2,83,10);
        for(const x of [75,WIDTH-97])poly([[x,54],[x+10,49],[x+20,54],[x+10,59]],d.secondary);
      }else if(d.header==='varsity'){
        rect(0,0,WIDTH,108,d.tint);
        poly([[0,0],[WIDTH-177,0],[WIDTH-177,70],[WIDTH-211,70],[WIDTH-211,96],[0,96]],accent);
        label(title,43,51,31,'FFFFFF');label('PERSONAL RESUME',44,77,12,'FFFFFF');
        rect(0,102,WIDTH-200,6,d.secondary);
      }else if(d.header==='terminal'){
        rect(30,17,WIDTH-60,96,accent);rect(30,17,WIDTH-60,18,d.tint);
        for(let i=0;i<3;i++)ellipse(42+i*12,23,6,6,i===0?accent:d.secondary);
        label('PROFILE / ENGINEERING',92,29,8);label(title,47,75,30,'FFFFFF');
        label('PERSONAL RESUME',48,98,11,d.secondary);rect(30,110,WIDTH-60,3,d.secondary);
      }else if(d.header==='portfolio'){
        rect(31,28,WIDTH-74,80,d.secondary);rect(40,20,WIDTH-70,81,d.tint);
        rect(40,20,photo?82:8,81,accent);
        const tx=photo?145:65;label('PROFILE / PERSONAL',tx,41,9);label(title,tx,77,30);
        rect(tx,91,WIDTH-tx-65,1,d.secondary);
      }else if(d.header==='newsprint'){
        label('PERSONAL RESUME',(WIDTH-measure('PERSONAL RESUME',20))/2,36,20);
        rect(38,45,WIDTH-76,1.4,accent);rect(38,49,WIDTH-76,.5,d.secondary);
        label(title,41,83,28);rect(300,60,.7,29,d.secondary);
        label('EXPERIENCE / SKILLS',318,73,10);label(locale==='en'?'CAREER PROFILE':'个人履历与专业记录',318,89,9);
        rect(38,96,WIDTH-76,1,accent);
      }else if(d.header==='collage'){
        poly([[42,18],[WIDTH-41,28],[WIDTH-46,93],[36,84]],d.secondary);
        rect(34,24,WIDTH-69,68,d.tint);rect(52,15,36,14,accent);rect(WIDTH-110,80,49,15,accent);
        label(title,60,65,29);label('PERSONAL RESUME',300,57,12);label(locale==='en'?'PROFILE / EXPERIENCE':'个人档案 / 求职履历',301,76,9);
      }else if(d.header==='han'){
        rect(36,20,3,89,accent);rect(36,20,WIDTH-72,.6,d.secondary);rect(36,108,WIDTH-72,.6,d.secondary);
        rect(54,34,36,36,accent);label(locale==='en'?'CV':'履历',locale==='en'?63:60,58,12,'FFFFFF');
        label(title,111,66,30);label('PERSONAL RESUME',112,90,10);rect(54,81,36,2,d.secondary);
      }else if(d.header==='journey'){
        label(title,45,59,31);label('CAREER JOURNEY',300,40,12);label('PERSONAL RESUME',300,63,9);
        rect(45,85,WIDTH-90,.8,d.secondary);
        for(const x of [45,WIDTH/2,WIDTH-45])ellipse(x-3,82,6,6,accent);
        rect(41,85,.8,22,accent);
      }else{
      label(locale === 'en' ? 'RESUME' : '个人简历', 45, 61, 34);
      rect(197,24,1.5,44,accent);
      label(locale === 'en' ? 'PROFESSIONAL PROFILE' : '细心从每一个小细节开始。',208,42,10);
      label('Personal resume',208,63,18);
      page(0).push({kind:'polygon',points:[[0,80],[340,80],[351,95],[0,95]],color:accent});
      page(0).push({kind:'polygon',points:[[344,80],[WIDTH,80],[WIDTH,95],[354,95]],color:d.secondary});
      // Original vector ornaments: education, work and a notebook.
      for (let i=0;i<3;i++) {
        const cx=465+i*35, cy=44;
        ellipse(cx-11,cy-11,22,22,d.secondary);
        if(i===0){
          page(0).push({kind:'polygon',points:[[cx-8,cy-2],[cx,cy-6],[cx+8,cy-2],[cx,cy+2]],color:'FFFFFF'});
          rect(cx-5,cy+3,10,2,'FFFFFF');rect(cx-8,cy-1,1,7,'FFFFFF');
        }else if(i===1){
          rect(cx-7,cy-3,14,10,'FFFFFF');rect(cx-3,cy-6,6,3,'FFFFFF');rect(cx-2,cy-5,4,2,d.secondary);rect(cx-7,cy,14,1,d.secondary);
        }else{
          rect(cx-5,cy-7,10,13,'FFFFFF');rect(cx-4,cy-6,8,11,d.secondary);rect(cx-1,cy-6,1,11,'FFFFFF');
          page(0).push({kind:'polygon',points:[[cx-4,cy+7],[cx+4,cy+7],[cx,cy+10]],color:'FFFFFF'});
        }
      }
      }
      if(photo&&foldedHeaderPhoto(appearance)){
        const px=appearance.photoMode==='header-left'?44:WIDTH-100;
        rect(px,21,73,87,'FFFFFF');picture(px+4,25,65,79);
      }
      const p=flow([{kind:'section',text:locale==='en'?'Personal information':'基本信息'}],{page:0,y:appearance.start},bx,bw);
      const bodyPhoto=photo&&!foldedHeaderPhoto(appearance), photoLeft=bodyPhoto&&appearance.photoMode==='left';
      const columns=appearance.columns??2;
      const infoTop=p.y+3, infoWidth=bodyPhoto?bw-92:bw, gap=15, cw=(infoWidth-gap*(columns-1))/columns, infoX=bx+5+(photoLeft?92:0);
      const card=appearance.identity==='tint'?rect(bx-5,infoTop-4,bw+5,0,d.tint):undefined;
      p.y=infoTop;
      for(let i=0;i<info.identity.length;i+=columns){
        const ends=info.identity.slice(i,i+columns).map((text,j)=>flow([{kind:'contact',text}],{...p},infoX+j*(cw+gap),cw));
        Object.assign(p,ends.sort((a,b)=>b.page-a.page||b.y-a.y)[0]);
        if(appearance.identity==='ruled')rect(infoX-5,p.y-1,infoWidth,.5,d.secondary,p.page);
      }
      if(bodyPhoto){picture(photoLeft?bx:WIDTH-63-31,infoTop-1,63,91);if(p.page===0)p.y=Math.max(p.y,infoTop+96);}
      else p.y+=5;
      if(card)card.height=(p.page===0?p.y:BOTTOM)-infoTop+4;
      if(info.intent.length){
        flow([{kind:'section',text:locale==='en'?'Career objective':'求职意向'}],p,bx,bw);
        const intentTop=p.y, intentPage=p.page;
        const strip=appearance.intent==='tint'?rect(bx-4,p.y-2,bw+4,0,d.tint,p.page):undefined;
        const iw=(bw-15*(info.intent.length-1))/info.intent.length;
        const ends=info.intent.map((text,i)=>flow([{kind:'subtitle',text}],{...p},bx+i*(iw+15),iw));
        Object.assign(p,ends.sort((a,b)=>b.page-a.page||b.y-a.y)[0]);
        if(strip)strip.height=(p.page===intentPage?p.y:BOTTOM)-intentTop+2;
      }
      const orderedInfo=[...info.sections].sort((a,b)=>rank(designOrder(d),a.id)-rank(designOrder(d),b.id));
      flow([...info.extra,...flat(orderedInfo)],p,bx,bw);
    } else if(d.body==='sidebar-left'||d.body==='sidebar-right'){
      const sw=d.sideWidth??180, sx=d.body==='sidebar-left'?0:WIDTH-sw, mx=d.body==='sidebar-left'?sw+29:margin, mw=WIDTH-sw-margin-29;
      rect(sx+22,27,sw-44,4,d.secondary);label(locale==='en'?'PROFILE':'个人档案',sx+24,52,9,'FFFFFF');
      let py=66;
      if(photo){rect(sx+(sw-84)/2-5,py-5,94,115,'FFFFFF');picture(sx+(sw-84)/2,py,84,105);py+=129;}
      const hp=flow(header.flatMap(b=>b.kind==='contact'?b.text.split(' | ').map(text=>({...b,text})):[b]),{page:0,y:py},sx+24,sw-48,true,false,'FFFFFF');
      hp.y+=4;flow(flat(sides),hp,sx+24,sw-48,true,false,'FFFFFF');
      label(locale==='en'?'CURRICULUM VITAE':'履历与作品',mx,42,9,accent);rect(mx,53,mw,1,d.secondary);
      flow(flat(main),{page:0,y:65},mx,mw);
    }else{
      const photoLeft=d.photoSide==='left', center=d.header==='center';
      let x=margin,y=47,w=wide,ink:string|undefined,photoBottom=0;
      const growing:ShapeOp[]=[];let stackLine:ShapeOp|undefined;
      const px=photoLeft?margin:WIDTH-margin-72;
      if(d.header==='executive'){
        rect(margin,25,wide,2,accent);rect(margin,30,wide,.5,d.secondary);label('PROFESSIONAL PROFILE',margin,47,8,accent);y=66;
        rect(WIDTH-margin-46,35,46,4,d.secondary);
      }else if(d.header==='swiss'){
        rect(margin,26,15,15,accent);label('CV / CURRICULUM VITAE',margin+26,37,8,accent);y=57;
      }else if(d.header==='academic'){
        rect(margin,24,wide,.7,accent);label(locale==='en'?'RESEARCH / CURRICULUM VITAE':'研究履历 / CURRICULUM VITAE',margin,43,9,accent);y=65;
      }else if(d.header==='varsity'){
        growing.push(rect(0,0,WIDTH,165,d.tint));rect(0,0,WIDTH,8,accent);rect(margin,25,144,22,accent);label('GRADUATE / 校园履历',margin+9,40,9,'FFFFFF');y=64;
        rect(WIDTH-38,26,10,48,d.secondary);rect(WIDTH-57,45,48,10,d.secondary);
      }else if(d.header==='terminal'){
        growing.push(rect(margin-12,24,wide+24,146,'18262D'));rect(margin-12,24,wide+24,25,accent);
        for(let i=0;i<3;i++)ellipse(margin+i*15,33,6,6,d.secondary);
        label('PROFILE / ENGINEERING',margin+62,40,8,'FFFFFF');y=64;ink='FFFFFF';
      }else if(d.header==='portfolio'){
        rect(0,0,WIDTH,8,accent);rect(WIDTH-153,8,153,45,d.secondary);label('SELECTED WORK / PORTFOLIO',margin,37,10,accent);
        rect(margin,48,wide,1.5,accent);y=70;
      }else if(d.header==='newsprint'){
        rect(margin,23,wide,2,accent);rect(margin,28,wide,.5,accent);label('THE CAREER JOURNAL',margin,53,20,accent);
        rect(margin,64,wide,.6,accent);y=80;
      }else if(d.header==='collage'){
        growing.push(rect(margin-8,38,wide+16,136,d.tint));rect(WIDTH/2-48,29,96,18,d.secondary);label('PERSONAL NOTES',margin+9,59,8,accent);y=75;
      }else if(d.header==='han'){
        label(locale==='en'?'PERSONAL RECORD':'个人履历',margin,45,14,accent);rect(WIDTH-margin-31,31,30,30,accent);label(locale==='en'?'CV':'履历',WIDTH-margin-28,51,11,'FFFFFF');
        rect(margin,59,wide-44,.6,d.secondary);y=77;
      }else if(d.header==='journey'){
        label('CAREER JOURNEY',margin,29,8,accent);rect(margin,44,wide,1,d.secondary);
        for(const point of [margin,margin+wide/2,margin+wide-7])ellipse(point,41,7,7,accent);y=65;
      }else if(d.header==='ribbon'){
        rect(0,0,WIDTH,44,accent);rect(0,44,WIDTH,4,d.secondary);label(locale==='en'?'CURRICULUM VITAE':'个人简历',margin,29,17,'FFFFFF');label('RESUME',WIDTH-109,27,11,'FFFFFF');y=70;
      }else if(d.header==='split'){
        growing.push(rect(0,0,WIDTH,168,accent),rect(photoLeft?0:WIDTH-161,0,161,168,d.secondary));ink='FFFFFF';x=photoLeft?183:margin;w=WIDTH-223;y=47;
      }else if(d.header==='corner'){
        rect(0,0,WIDTH,16,accent);rect(photoLeft?0:WIDTH-153,16,153,154,d.tint);rect(photoLeft?0:WIDTH-91,16,91,22,d.secondary);rect(photoLeft?0:WIDTH-24,38,24,133,accent);
        x=photoLeft?169:margin;w=WIDTH-209;y=48;
      }else if(d.header==='masthead'){
        rect(0,0,WIDTH,32,d.tint);label('CURRICULUM VITAE',margin,21,9,accent);rect(margin,39,wide,1,accent);y=57;
      }else if(d.header==='frame'){
        growing.push(rect(margin-12,30,wide+24,132,d.tint),rect(margin-12,30,5,132,accent));y=48;
        if(d.id==='blueprint')for(let gx=margin;gx<WIDTH-margin;gx+=18)rect(gx,31,.3,18,d.secondary);
      }else if(d.header==='ticket'){
        growing.push(rect(margin-10,31,wide+20,123,d.tint),rect(margin-10,31,9,123,accent),rect(WIDTH-margin-2,31,12,123,d.secondary));y=48;
      }else if(d.header==='ledger'){
        label(locale==='en'?'PROFESSIONAL PROFILE':'求职档案',margin,39,18,accent);label('RESUME',WIDTH-106,39,10,accent);rect(margin,51,wide,2,accent);growing.push(rect(margin,56,wide,112,d.tint));y=69;x=margin+13;w=wide-26;
      }else if(d.header==='stack'){
        rect(margin,30,6,105,accent);label(locale==='en'?'CAREER PROFILE':'求职档案 / PERSONAL RESUME',margin+18,42,9,accent);x=margin+18;y=59;w=wide-18;stackLine=rect(0,156,WIDTH,5,d.secondary);
      }else if(center){
        rect(0,0,WIDTH,photo?70:22,d.tint);
        if(photo){ellipse(WIDTH/2-51,25,102,102,d.secondary);picture(WIDTH/2-34,33,68,85);y=137;}else y=43;
      }
      if(photo&&!center){
        const pY=['ribbon','executive','academic','varsity','terminal','portfolio','journey'].includes(d.header)?66:['newsprint','collage','han'].includes(d.header)?80:d.header==='ledger'?63:43;
        photoBottom=pY+110;
        rect(px-4,pY-4,80,101,'FFFFFF');picture(px,pY,72,93);
        if(!['split','corner'].includes(d.header)){
          if(photoLeft){x=margin+105;w=wide-105;}else w=Math.min(w,wide-99);
        }
      }
      const hp=flow(header,{page:0,y},x,w,false,center,ink);
      for(const op of growing)op.height=Math.max(op.height,hp.y+8-op.y);
      if(stackLine)stackLine.y=Math.max(stackLine.y,hp.y+8);
      // Header colour stays behind all wrapped text; use a white spacer beneath it.
      const start=Math.max(hp.y+20,...growing.map(op=>op.y+op.height+7),stackLine?stackLine.y+stackLine.height+8:0,photo&&!center?Math.max(165,photoBottom):0,['split','corner','stack','ledger'].includes(d.header)?187:0);
      const footer=(position:Position,items:typeof sections)=>{
        if(!items.length)return;
        if(position.y+90>BOTTOM)next(position);
        const count=d.body==='full'?Math.min(3,items.length):2,gap=22,cw=(wide-gap*(count-1))/count;
        const columns=Array.from({length:count},(_,i)=>items.filter((_,j)=>j%count===i));
        columns.forEach((list,i)=>flow(flat(list),{...position,y:position.y+6},margin+i*(cw+gap),cw,true));
      };
      if(d.body==='sequential'||d.body==='chronicle'){
        const inset=d.body==='chronicle'?15:0;
        flow(flat(ordered),{page:0,y:start},margin+inset,wide-inset);
      }else if(d.body==='full'){
        const end=flow(flat(main),{page:0,y:start},margin,wide);footer(end,sides);
      }else if(d.body==='rail'){
        const p={page:0,y:start};const lw=d.section==='number'?73:100;
        for(const s of main){
          const first=s.blocks.slice(0,3).reduce((sum,b)=>{const style=blockStyle(b.kind,template);return sum+style.before+style.after+style.line*wrap(b.text,style.size,wide-lw-22).length;},0);
          if(p.y+Math.min(Math.max(65,first),BOTTOM-TOP)>BOTTOM&&p.y>TOP)next(p);
          const at={...p};rect(margin,at.y,wide,.8,d.secondary,at.page);
          if(d.section==='box')rect(margin,at.y,1,Math.min(70,Math.max(35,first)),d.secondary,at.page);
          if(['tab','band'].includes(d.section))rect(margin,at.y+10,lw-6,27,accent,at.page);
          if(d.section==='number')page(at.page).push({kind:'text',x:margin,y:at.y+35,text:String(sectionNumbers.get(s.id)??1).padStart(2,'0'),size:27,color:accent,bold:true});
          wrap(s.heading.text,10.2,lw-12).forEach((text,j)=>page(at.page).push({kind:'text',x:margin+6,y:at.y+(d.section==='number'?57:29)+j*16,text,size:10.2,color:['tab','band'].includes(d.section)?'FFFFFF':accent,bold:true}));
          p.y+=12;flow(s.blocks,p,margin+lw+20,wide-lw-20);
          if(p.page===at.page)p.y=Math.max(p.y,at.y+(d.section==='number'?75:48));p.y+=12;
        }
        footer(p,sides);
      }else{
        const balanced=d.body==='balanced',left=d.body==='left';
        const sw=balanced?(wide-28)/2:d.sideWidth??151,mw=balanced?sw:wide-sw-28;
        const sx=left?margin:margin+mw+28,mx=left?margin+sw+28:margin;
        const sideList=balanced?balancedSections(ordered):sides;
        const mainList=ordered.filter(s=>!sideList.includes(s));
        if(!sideList.length||!mainList.length)flow(flat(ordered),{page:0,y:start},margin,wide);
        else{rect(sx-9,start-4,sw+18,Math.max(0,BOTTOM-start+4),d.tint);flow(flat(mainList),{page:0,y:start},mx,mw,false);flow(flat(sideList),{page:0,y:start},sx,sw,!balanced);}
      }
    }
  } else if (template === 'modern') {
    picture(34,40,86,105);
    const sideHeader = flow(header.flatMap(b => b.kind === 'contact' ? b.text.split(' | ').map(text => ({...b,text})) : [b]), {page:0,y:photo?165:58}, 30, 125, true, false, 'FFFFFF');
    sideHeader.y += 18;
    const side = sections.filter(s=>sidebarSections.has(s.id));
    flow(flat(side), sideHeader, 30, 125, true, false, 'FFFFFF');
    flow(flat(sections.filter(s=>!sidebarSections.has(s.id))), {page:0,y:38}, 218, 337);
  } else if (template === 'classic') {
    page(0).push({kind:'rect',x:0,y:0,width:WIDTH,height:171,color:'283534'});
    page(0).push({kind:'rect',x:38,y:31,width:34,height:5,color:'D8EF84'});
    picture(490,44);
    const hp = flow(header,{page:0,y:49},38,photo?422:516,false,false,'FFFFFF');
    const start = Math.max(195,hp.y+28);
    // Extend the banner when a long name/contact block wraps; never cover text.
    if(hp.y>163) page(0).splice(2,0,{kind:'rect',x:0,y:163,width:WIDTH,height:hp.y-155,color:'283534'});
    const side=sections.filter(s=>sidebarSections.has(s.id)), main=sections.filter(s=>!sidebarSections.has(s.id));
    page(0).push({kind:'rect',x:424,y:start-10,width:141,height:HEIGHT-start-26,color:'F2F5E8'});
    flow(flat(main),{page:0,y:start},38,360);
    flow(flat(side),{page:0,y:start},438,114,true);
  } else if (template === 'timeline' || template === 'campus') {
    if(template==='campus') page(0).push({kind:'rect',x:0,y:0,width:WIDTH,height:159,color:'E7F0E9'});
    picture(template==='timeline'?461:488,38);
    const hp=flow(header,{page:0,y:38},38,photo?370:500);
    const start=Math.max(170,hp.y+22);
    const side=sections.filter(s=>sidebarSections.has(s.id) && !(template==='campus' && s.id==='education'));
    const main=sections.filter(s=>!side.includes(s));
    if(template==='campus') main.sort((a,b)=>rank(['education','summary','projects','work'],a.id)-rank(['education','summary','projects','work'],b.id));
    if(template==='campus') page(0).push({kind:'rect',x:425,y:start-10,width:135,height:Math.max(0,HEIGHT-start-27),color:'F0F6F1'});
    flow(flat(main),{page:0,y:start},template==='timeline'?52:38,template==='timeline'?340:360);
    flow(flat(side),{page:0,y:start},437,118,true);
  } else {
    picture(491,39);
    const hp=flow(header,{page:0,y:40},40,photo?415:515);
    const position={page:0,y:Math.max(142,hp.y+12)};
    const extras=template==='editorial'?sections.filter(s=>['certificates','languages','awards','interests'].includes(s.id)):[];
    const ordered=template==='editorial'?[...sections.filter(s=>!extras.includes(s))].sort((a,b)=>rank(['summary','projects','work','skills','education'],a.id)-rank(['summary','projects','work','skills','education'],b.id)):sections;
    for (let i=0;i<ordered.length;i++) {
      const section=ordered[i]!;
      if(position.y+75>BOTTOM) next(position);
      const start={...position};
      page(start.page).push({kind:'rect',x:40,y:start.y-4,width:515,height:0.7,color:'D7DDE0'});
      const labelWidth=template==='editorial'?64:85;
      if(template==='editorial') page(start.page).push({kind:'text',x:40,y:start.y+23,text:String(i+1).padStart(2,'0'),size:23,color:palette[template]!,bold:true});
      else page(start.page).push({kind:'rect',x:40,y:start.y+8,width:84,height:Math.max(25,wrap(section.heading.text,9.5,labelWidth-8).length*15+10),color:palette[template]!});
      const labels=wrap(section.heading.text,9.5,labelWidth-8);
      labels.forEach((text,j)=>page(start.page).push({kind:'text',x:template==='editorial'?40:46,y:start.y+(template==='editorial'?45:25)+j*15,text,size:9.5,color:template==='editorial'?palette[template]!:'FFFFFF',bold:true}));
      position.y+=8;
      flow(section.blocks,position,template==='editorial'?132:144,template==='editorial'?423:411);
      if(position.page===start.page) position.y=Math.max(position.y,start.y+(template==='editorial'?46:28)+labels.length*8);
      position.y+=10;
    }
    for(let i=0;i<extras.length;i+=2){
      if(position.y+80>BOTTOM) next(position);
      page(position.page).push({kind:'rect',x:40,y:position.y,width:515,height:.7,color:'D7DDE0'});
      const ends=extras.slice(i,i+2).map((section,j)=>{
        const x=40+j*270,p={...position,y:position.y+13};
        page(p.page).push({kind:'text',x,y:p.y+10,text:section.heading.text,size:10,color:palette[template]!,bold:true});
        p.y+=23;return flow(section.blocks,p,x,245);
      }).sort((a,b)=>a.page-b.page||a.y-b.y);
      Object.assign(position,ends[ends.length-1]);position.y+=12;
    }
  }
  if (!pages.length) page(0);
  spines.forEach((spine, index) => {
    const content = pages[index]!.filter(op => op !== spine && !(op.kind === 'rect' && op.x === 0 && op.y === 0 && op.width === WIDTH && op.height === HEIGHT));
    const bottom = Math.max(spine.y, ...content.map(op => op.kind === 'polygon' ? Math.max(...op.points.map(p => p[1])) : op.kind === 'text' ? op.y + 4 : op.y + op.height));
    spine.height = Math.max(0, bottom - spine.y);
  });
  pages.forEach((ops, index) => {
    const text = `${index + 1} / ${pages.length}`;
    ops.push({ kind: 'text', x: WIDTH - 42 - measure(text, 8), y: 817, text, size: 8, color: '687681' });
  });
  return { pages, font, bytes };
}

export async function renderPdf(blocks: Block[], template: TemplateId, locale: Locale, photo?: ResumePhoto) {
  const { pages, bytes } = await prepare(blocks, template, locale, photo);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit({ create(data: Uint8Array) {
    const font = createFont(Buffer.from(data));
    if (!('createSubset' in font)) throw new Error('A single font face is required.');
    const createSubset = font.createSubset.bind(font);
    font.createSubset = () => { const subset = createSubset(); return Object.assign(subset, { encodeStream: () => Readable.from([subset.encode()]) }); };
    return font;
  } } as unknown as Parameters<PDFDocument['registerFontkit']>[0]);
  const font = await pdf.embedFont(bytes, { subset: true });
  pdf.setTitle(blocks[0]?.text ?? 'Resume'); pdf.setCreator('Super Resume'); pdf.setProducer('Super Resume');
  const color = (hex: string) => rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255);
  for (const ops of pages) {
    const page = pdf.addPage([WIDTH, HEIGHT]);
    for (const op of ops) {
      if (op.kind === 'rect') page.drawRectangle({ x: op.x, y: HEIGHT - op.y - op.height, width: op.width, height: op.height, color: color(op.color) });
      else if(op.kind==='ellipse')page.drawEllipse({x:op.x+op.width/2,y:HEIGHT-op.y-op.height/2,xScale:op.width/2,yScale:op.height/2,color:color(op.color)});
      else if(op.kind==='polygon')page.drawSvgPath(op.points.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ')+' Z',{x:0,y:HEIGHT,color:color(op.color)});
      else if (op.kind === 'image') {
        // pdf-lib's JPEG reader creates a DataView on the backing ArrayBuffer;
        // pooled Node buffers can start at a nonzero offset in that buffer.
        const image = op.photo.type === 'png' ? await pdf.embedPng(op.photo.data) : await pdf.embedJpg(new Uint8Array(op.photo.data));
        page.drawImage(image,{x:op.x,y:HEIGHT-op.y-op.height,width:op.width,height:op.height});
      } else {
        const options = { x: op.x, y: HEIGHT - op.y, size: op.size, font, color: color(op.color) };
        if (op.bold) page.pushOperators(pushGraphicsState(), setLineWidth(0.13), setStrokingColor(color(op.color)), setTextRenderingMode(TextRenderingMode.FillAndOutline));
        page.drawText(op.text, options);
        if (op.bold) page.pushOperators(popGraphicsState());
      }
    }
  }
  return { data: Buffer.from(await pdf.save()), pageCount: pages.length };
}

export async function renderPreview(blocks: Block[], template: TemplateId, locale: Locale, photo?: ResumePhoto, allPages = false) {
  const { pages, font } = await prepare(blocks, template, locale, photo);
  const previews = pages.slice(0, allPages ? pages.length : 6).map((ops, index) => {
    const glyphs = new Map<number, string>();
    const shapes = ops.map((op) => {
      if (op.kind === 'rect') return `<rect x="${n(op.x)}" y="${n(op.y)}" width="${n(op.width)}" height="${n(op.height)}" fill="#${op.color}"/>`;
      if(op.kind==='ellipse')return `<ellipse cx="${n(op.x+op.width/2)}" cy="${n(op.y+op.height/2)}" rx="${n(op.width/2)}" ry="${n(op.height/2)}" fill="#${op.color}"/>`;
      if(op.kind==='polygon')return `<polygon points="${op.points.map(([x,y])=>`${n(x)},${n(y)}`).join(' ')}" fill="#${op.color}"/>`;
      if (op.kind === 'image') return `<image href="${op.photo.uri}" x="${n(op.x)}" y="${n(op.y)}" width="${n(op.width)}" height="${n(op.height)}"/>`;
      const run = font.layout(op.text), scale = op.size / font.unitsPerEm;
      let x = op.x, y = op.y;
      const outlines = run.glyphs.map((glyph, i) => {
        if (!glyphs.has(glyph.id)) glyphs.set(glyph.id, glyph.path.toSVG());
        const pos = run.positions[i]!;
        const use = `<use href="#g${glyph.id}" transform="translate(${n(x + pos.xOffset * scale)} ${n(y - pos.yOffset * scale)}) scale(${n(scale)} ${n(-scale)})"/>`;
        x += pos.xAdvance * scale; y -= pos.yAdvance * scale;
        return use;
      }).join('');
      return `<g fill="#${op.color}"${op.bold ? ` stroke="#${op.color}" stroke-width="${n(0.13 / scale)}" stroke-linejoin="round"` : ''}><title>${xml(op.text)}</title>${outlines}</g>`;
    }).join('');
    const defs = [...glyphs].map(([id, d]) => `<path id="g${id}" d="${d}"/>`).join('');
    return { page: index + 1, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${xml(blocks[0]?.text ?? 'Resume')} ${index + 1}"><title>${xml(blocks[0]?.text ?? 'Resume')}</title><rect width="100%" height="100%" fill="white"/><defs>${defs}</defs>${shapes}</svg>` };
  });
  return { template, locale, pageCount: pages.length, previewedPages: previews.length, pages: previews, warnings: pages.length > previews.length ? ['Preview shows the first 6 pages; PDF/DOCX export includes the complete resume.'] : [] };
}
