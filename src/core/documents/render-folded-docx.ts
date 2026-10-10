import { readFile } from 'node:fs/promises';
import { Paragraph, TextRun, ImageRun, Table, TableCell, TableRow, BorderStyle, WidthType, TableLayoutType, VerticalAlign, HeadingLevel, AlignmentType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType } from 'docx';
import { foldedLayout } from './folded-layout.js';
import { blockStyle } from './render-pdf.js';
import type { Block, Locale } from './layout.js';
import type { ResumePhoto } from './photo.js';
import { designFor, designOrder } from './designs.js';
import { foldedStyleFor, foldedHeaderPhoto } from './folded-styles.js';
import type { TemplateId } from './templates.js';

declare const SUPER_RESUME_DECORATION_PATH: URL | undefined;
const assets = typeof SUPER_RESUME_DECORATION_PATH !== 'undefined' ? SUPER_RESUME_DECORATION_PATH : new URL('../../../assets/decorations/', import.meta.url);
const font = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: 'Microsoft YaHei', cs: 'Arial' };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const borders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };

/** Text remains native Word content; only text-free ornaments are images. */
export async function foldedDocx(blocks: Block[], locale: Locale, photo?: ResumePhoto, template: TemplateId = 'bluegold-classic'): Promise<(Paragraph | Table)[]> {
  const design=designFor(template)!, appearance=foldedStyleFor(template), blue=design.accent;
  const spine = { style: BorderStyle.SINGLE, color: blue, size: 5, space: 8 };
  const [ribbon, banner, icons] = await Promise.all([appearance.asset+'-section-'+(locale==='en'?'en':'zh')+'.png',appearance.asset+'-banner.png',appearance.asset+'-icons.png'].map(name=>readFile(new URL(name,assets))));
  const info = foldedLayout(blocks,locale), width=10306;
  const run = (text:string,size=19,color='26333B',bold=false) => new TextRun({text,font,size,color,bold});
  const cell = (children:Paragraph[],w:number,left=0,fill?:string) => new TableCell({width:{size:w,type:WidthType.DXA},borders,verticalAlign:VerticalAlign.TOP,...(fill?{shading:{fill}}:{}),margins:{top:0,bottom:0,left,right:0},children:children.length?children:[new Paragraph({spacing:{before:0,after:0,line:20},children:[]})]});
  const row = (cells:TableCell[],widths:number[],line=false,grid=false) => new Table({width:{size:width,type:WidthType.DXA},columnWidths:widths,layout:TableLayoutType.FIXED,borders:{...borders,...(line?{left:spine}:{}),...(grid?{top:spine,bottom:spine,right:spine,insideVertical:spine}:{})},rows:[new TableRow({cantSplit:false,children:cells})]});
  const floated = (data:Buffer,w:number,h:number,x:number,page=false) => new ImageRun({type:'png',data,transformation:{width:w*4/3,height:h*4/3},floating:{horizontalPosition:{relative:page?HorizontalPositionRelativeFrom.PAGE:HorizontalPositionRelativeFrom.COLUMN,offset:x*12700},verticalPosition:{relative:page?VerticalPositionRelativeFrom.PARAGRAPH:VerticalPositionRelativeFrom.LINE,offset:0},behindDocument:true,allowOverlap:true,wrap:{type:TextWrappingType.NONE}}});
  const heading = (text:string) => new Paragraph({heading:HeadingLevel.HEADING_1,keepNext:true,indent:{left:80},spacing:{before:100,after:80,line:360,lineRule:'exact'},children:[floated(ribbon!,525,24,-10),run(text,22,['outline','edge'].includes(appearance.tag)?blue:'FFFFFF',false)]});
  const body = (block:Block) => {
    if(block.kind==='section')return heading(block.text);
    const style=blockStyle(block.kind,template);
    return new Paragraph({keepNext:['entry','detail'].includes(block.kind),widowControl:true,border:{left:spine},indent:{left:240,...(block.kind==='bullet'?{left:400,hanging:160}:{})},spacing:{before:style.before*20,after:style.after*20,line:style.line*20,lineRule:'atLeast'},children:[run((block.kind==='bullet'?'• ':'')+block.text,Math.round(style.size*2),block.kind==='detail'?'657078':'26333B',block.kind==='entry')]});
  };
  const centered=['ledger','center','academic'].includes(design.header), dark=['ribbon','corner','executive','varsity','terminal'].includes(design.header);
  const title = new Paragraph({heading:HeadingLevel.TITLE,alignment:centered?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:0,after:0,line:centered?720:880,lineRule:'exact'},children:[run(locale==='en'?'RESUME':'个人简历',centered?60:64,dark?'FFFFFF':blue)]});
  const caption = new Paragraph({border:{left:{...spine,space:7,size:10}},spacing:{before:60,after:0,line:360},children:[run(locale==='en'?'PROFESSIONAL PROFILE':'细心从每一个小细节开始。',19,blue),new TextRun({text:'Personal resume',break:1,font,size:34,color:blue})]});
  const ornament = new Paragraph({spacing:{before:220,after:0},children:[new ImageRun({type:'png',data:icons!,transformation:{width:100*4/3,height:25*4/3}})]});
  const photoParagraph=(compact=false)=>{
    if(!photo)return new Paragraph('');
    const scale=Math.min((compact?80:84)/photo.width,(compact?104:121.33)/photo.height);
    return new Paragraph({spacing:{before:0,after:100,line:Math.ceil(photo.height*scale*15),lineRule:'atLeast'},children:[new ImageRun({data:photo.data,type:photo.type,transformation:{width:photo.width*scale,height:photo.height*scale}})]});
  };
  const result:(Paragraph|Table)[]=[];
  const label=(text:string,color=blue,size=20,center=false)=>new Paragraph({alignment:center?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:60,after:20,line:size*13,lineRule:'atLeast'},children:[run(text,size,color)]});
  const rule=(color=design.secondary)=>new Paragraph({spacing:{before:20,after:40,line:20},border:{bottom:{style:BorderStyle.SINGLE,color,size:6}},children:[]});
  if(appearance.priority){
    if(design.header==='executive'){
      result.push(rule(),row([cell([title,label('PERSONAL RESUME',design.secondary)],6600,160,blue),cell([label('CAREER / PROFILE'),label(locale==='en'?'EXPERIENCE & SKILLS':'工作经历 / 专业能力',blue,18)],3706,160,design.tint)],[6600,3706]));
    }else if(design.header==='academic'){
      result.push(rule(blue),title,label('PERSONAL RECORD',blue,20,true));
    }else if(design.header==='newsprint'){
      result.push(label('PERSONAL RESUME',blue,32,true),rule(blue),row([cell([title],5500),cell([label('EXPERIENCE / SKILLS'),label(locale==='en'?'CAREER PROFILE':'个人履历与专业记录',blue,18)],4806,100)],[5500,4806]));
    }else if(design.header==='collage'){
      result.push(row([cell([title],5300,180,design.tint),cell([label('PERSONAL RESUME',blue,23),label(locale==='en'?'PROFILE / EXPERIENCE':'个人档案 / 求职履历',blue,18)],5006,160,design.tint)],[5300,5006]));
    }else if(design.header==='journey'){
      result.push(row([cell([title],5600),cell([label('CAREER JOURNEY',blue,24),label('●                         ●                         ●',design.secondary,16)],4706,120)],[5600,4706]));
    }else if(design.header==='han'){
      const stamp=label(locale==='en'?'CV':'履历','FFFFFF',25,true), main=[title,label('PERSONAL RESUME',blue,20)];
      const widths=photo?[1000,7646,1660]:[1000,9306];
      result.push(rule(),row([cell([stamp],1000,0,blue),cell(main,widths[1]!,180),...(photo?[cell([photoParagraph(true)],1660,40,design.tint)]:[])],widths));
    }else{
      const left=appearance.photoMode==='header-left', fill=dark?blue:design.header==='portfolio'?design.tint:undefined;
      const heads=[...(design.header==='terminal'?[label('●  ●  ●    PROFILE / ENGINEERING',design.secondary,16)]:design.header==='swiss'?[label('CV / PROFILE',blue,18)]:[]),title,label('PERSONAL RESUME',dark?design.secondary:blue,21)];
      const widths=photo?[8646,1660]:[10306];
      const cells=[cell(heads,widths[0]!,180,fill)];
      if(photo){const pc=cell([photoParagraph(true)],1660,40,design.tint);if(left){cells.unshift(pc);widths.unshift(widths.pop()!);}else cells.push(pc);}
      result.push(row(cells,widths));
    }
  }else if(design.header==='folded')result.push(row([cell([title],3100),cell([caption],4600,160),cell([ornament],2606)],[3100,4600,2606]));
  else if(centered){
    result.push(title,new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0,line:280,lineRule:'exact'},children:[run('PERSONAL RESUME',20,blue)]}));
  }else if(foldedHeaderPhoto(appearance)){
    const captionText=new Paragraph({spacing:{before:80,after:0,line:360},children:[run('PERSONAL RESUME',24,dark?'FFFFFF':design.secondary)]});
    const headFill=dark?blue:undefined;
    const widths=photo?[8506,1800]:[10306];
    result.push(row([cell([title,captionText],widths[0]!,dark?180:0,headFill),...(photo?[cell([photoParagraph()],1800,100,design.tint)]:[])],widths));
  }else{
    const fill=dark?blue:design.tint;
    const captionText=new Paragraph({spacing:{before:120,after:0,line:330},children:[run('PERSONAL RESUME',27,dark?'FFFFFF':blue),new TextRun({text:locale==='en'?'EXPERIENCE / SKILLS':'教育 · 技能 · 经历',break:1,font,size:18,color:dark?design.secondary:blue})]});
    result.push(row([cell([title],4400,180,fill),cell([captionText],5906,180,fill)],[4400,5906]));
  }
  const classic=design.header==='folded';
  result.push(new Paragraph({spacing:{before:classic?200:centered?20:100,after:classic?180:120,line:classic?300:centered?120:240,lineRule:'exact'},children:[floated(banner!,595.28,15,0,true)]}),heading(locale==='en'?'Personal information':'基本信息'));
  const identity = info.identity.map(text=>new Paragraph({spacing:{before:0,after:80,line:300,lineRule:'atLeast'},...(appearance.identity==='ruled'?{border:{bottom:{style:BorderStyle.SINGLE,color:design.secondary,size:4,space:2},between:{style:BorderStyle.SINGLE,color:design.secondary,size:4,space:2}}}:{}),children:[run(text,19)]}));
  const bodyPhoto=photo&&!foldedHeaderPhoto(appearance), columns=appearance.columns??2;
  const cols=columns===3?[3436,3436,3434]:bodyPhoto?[4010,4636,1660]:[5000,5306], fill=appearance.identity==='tint'?design.tint:undefined;
  const cells=Array.from({length:columns},(_,col)=>cell(identity.filter((_,i)=>i%columns===col),cols[col]!,col===0?240:100,fill));
  if(bodyPhoto){
    const portraitCell=cell([photoParagraph()],cols[2]!,appearance.photoMode==='left'?120:0,fill);
    if(appearance.photoMode==='left'){cells.unshift(portraitCell);cols.unshift(cols.pop()!);}else cells.push(portraitCell);
  }
  result.push(row(cells,cols,true,appearance.identity==='ruled'));
  if(info.intent.length){
    result.push(heading(locale==='en'?'Career objective':'求职意向'));
    const sizes=info.intent.map(()=>Math.floor(width/info.intent.length));
    result.push(row(info.intent.map((text,i)=>cell([new Paragraph({spacing:{after:80,line:300},children:[run(text,20)]})],sizes[i]!,240,appearance.intent==='tint'?design.tint:undefined)),sizes,true));
  }
  const order=designOrder(design);
  const rank=(id:string)=>order.includes(id)?order.indexOf(id):99;
  const ordered=[...info.sections].sort((a,b)=>rank(a.id)-rank(b.id));
  result.push(...info.extra.map(body),...ordered.flatMap(s=>[s.heading,...s.blocks]).map(body));
  return result;
}
