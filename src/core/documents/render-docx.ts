import { Document, Packer, Paragraph, TextRun, HeadingLevel, Footer, PageNumber, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TableLayoutType, VerticalAlign, ImageRun } from 'docx';
import type { Block, Locale } from './layout.js';
import { splitSections, sidebarSections, balancedSections, templateAccent, type TemplateId } from './templates.js';
import type { ResumePhoto } from './photo.js';
import { blockStyle } from './render-pdf.js';
import { designFor, designOrder } from './designs.js';
import { foldedDocx } from './render-folded-docx.js';

const font = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: 'Microsoft YaHei', cs: 'Arial' };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };

export async function renderDocx(blocks: Block[], locale: Locale, template: TemplateId, photo?: ResumePhoto) {
  const accent = templateAccent(template);
  const design = designFor(template);
  const { header, sections } = splitSections(blocks);
  const sectionNumbers=new Map<string,number>();
  function paragraphs(input: Block[], narrow = false, center = false, rail = false, ink?: string) {
    return input.map((block, index) => {
      const settings = blockStyle(block.kind, template, narrow);
      const heading = ['title', 'section', 'entry'].includes(block.kind);
      const next = input[index + 1]?.kind;
      const sectionStyle=design&&block.kind==='section'&&!rail;
      const filled=sectionStyle&&['band','tab'].includes(design.section);
      const sectionBorder=sectionStyle?{style:BorderStyle.SINGLE,color:ink?'ADBEBD':design.secondary,size:5,space:design.body==='sequential'&&design.section==='double'?2:5}:undefined;
      return new Paragraph({
        ...(block.kind === 'title' ? { heading: HeadingLevel.TITLE } : block.kind === 'section' ? { heading: HeadingLevel.HEADING_1 } : {}),
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        // A rail label ends its own table cell; keeping it with the next paragraph
        // can make editors move the entire long row onto a new page.
        keepNext: !rail && next !== undefined && (heading || (block.kind === 'detail' && ['detail', 'body', 'bullet'].includes(next))),
        widowControl: true,
        ...(rail && template === 'compact' ? {shading:{fill:accent}} : {}),
        ...(filled?{shading:{fill:ink?'FFFFFF':accent}}:{}),
        spacing: { before: Math.round((rail ? 0 : settings.before) * 20), after: Math.round((rail && template === 'editorial' ? 3 : settings.after) * 20), line: Math.round(settings.line * 20), lineRule: 'atLeast' },
        ...(block.kind === 'section' && !rail ? { border: { bottom: { style: BorderStyle.SINGLE, color: template === 'modern' ? 'C1D5CB' : 'C4CBD1', size: 4, space: 4 } } } : {}),
        ...(sectionBorder&&design?{border:design.section==='box'?{top:sectionBorder,bottom:sectionBorder,left:sectionBorder,right:sectionBorder}:design.section==='marker'?{left:{...sectionBorder,size:18,color:accent}}:{bottom:sectionBorder,...(design.section==='double'?{top:sectionBorder}:{})}}:{}),
        ...(template === 'timeline' && !narrow && !rail && ['entry','detail','body','bullet'].includes(block.kind) ? { border: { left: { style: BorderStyle.SINGLE, color: 'CBD9F6', size: 5, space: 6 } } } : {}),
        ...(design?.body==='chronicle'&&['entry','detail','body','bullet'].includes(block.kind)?{border:{left:{style:BorderStyle.SINGLE,color:design.secondary,size:block.kind==='entry'?16:5,space:8}}}:{}),
        ...(block.kind === 'bullet' ? { indent: { left: 200, hanging: 200 } } : {}),
        children: (block.kind === 'bullet' ? `• ${block.text}` : sectionStyle&&design.section==='number'?`${String(sectionNumbers.get(block.section??'other')??1).padStart(2,'0')}  ${block.text}`:sectionStyle&&design.section==='icon'?`●  ${block.text}`:block.text).split('\n').map((line, i) => new TextRun({
          text: line, ...(i ? { break: 1 } : {}), font, size: Math.round(settings.size * 2), bold: heading,
          color: filled?(ink?accent:'FFFFFF'):ink ?? (block.kind === 'section' || block.kind === 'subtitle' ? accent : ['contact', 'detail'].includes(block.kind) ? '657078' : '26333B'),
        })),
      });
    });
  }
  const rank = (order:string[],id:string) => order.includes(id) ? order.indexOf(id) : 99;
  const flat = (items: typeof sections) => items.flatMap(s => [s.heading,...s.blocks]);
  const photoScale = photo ? Math.min((design?90:72) / photo.width, (design?117:100) / photo.height) : 1;
  const picture = (center=false) => photo ? [new Paragraph({alignment:center?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:0,after:160,line:Math.ceil(photo.height*photoScale*15),lineRule:'atLeast'},children:[new ImageRun({data:photo.data,type:photo.type,transformation:{width:photo.width*photoScale,height:photo.height*photoScale}})]})] : [];
  const cell = (children: Paragraph[], width: number, fill?: string, padding = 200) => new TableCell({width:{size:width,type:WidthType.DXA},borders,verticalAlign:VerticalAlign.TOP,...(fill?{shading:{fill}}:{}),margins:{top:padding,bottom:padding,left:padding,right:padding},children:children.length?children:[new Paragraph('')]});
  const table = (cells: TableCell[], widths: number[]) => new Table({width:{size:10226,type:WidthType.DXA},columnWidths:widths,layout:TableLayoutType.FIXED,borders,rows:[new TableRow({cantSplit:false,children:cells})]});
  // Small rows allow Word to start beneath the header and break across pages.
  // A single oversized row may move to a fresh page before the editor splits it.
  const columns = (main: Paragraph[], side: Paragraph[], fill: string) => {
    const length = Math.max(main.length, side.length);
    const widths = [7340, 2886];
    return new Table({width:{size:10226,type:WidthType.DXA},columnWidths:widths,layout:TableLayoutType.FIXED,borders,
      rows:Array.from({length},(_,index)=>new TableRow({cantSplit:false,children:[main,side].map((column,columnIndex)=>new TableCell({
        width:{size:widths[columnIndex]!,type:WidthType.DXA},borders,verticalAlign:VerticalAlign.TOP,
        ...(columnIndex===1?{shading:{fill}}:{}),
        margins:{top:index===0?170:0,bottom:index===length-1?170:0,left:170,right:170},
        children:[column[index]??new Paragraph({spacing:{before:0,after:0,line:20},children:[new TextRun({text:'',size:2})]})],
      }))}))});
  };
  let children: (Paragraph | Table)[];
  if(design?.section==='folded') children=await foldedDocx(blocks,locale,photo,template);
  else if(design){
    const d=design, ordered=[...sections].sort((a,b)=>rank(designOrder(d),a.id)-rank(designOrder(d),b.id));
    const sideIds=new Set(['skills','certificates','languages','awards','interests',...(['campus','academic'].includes(d.specimen)?[]:['education'])]);
    const side=ordered.filter(s=>sideIds.has(s.id)), main=ordered.filter(s=>!sideIds.has(s.id));
    (['full','rail'].includes(d.body)?[...main,...side]:ordered).forEach((s,i)=>sectionNumbers.set(s.id,i+1));
    const line=(color=d.secondary)=>new Paragraph({spacing:{before:60,after:60,line:20},border:{bottom:{style:BorderStyle.SINGLE,color,size:6}}});
    const caption=(text:string,color=accent)=>new Paragraph({spacing:{after:100},children:[new TextRun({text,font,size:18,color})]});
    const columnTable=(left:Paragraph[],right:Paragraph[],widths:number[],fills:(string|undefined)[],long=false)=>{
      if(!long)return table([cell(left,widths[0]!,fills[0],180),cell(right,widths[1]!,fills[1],180)],widths);
      const count=Math.max(left.length,right.length);
      return new Table({width:{size:10226,type:WidthType.DXA},columnWidths:widths,layout:TableLayoutType.FIXED,borders,rows:Array.from({length:count},(_,i)=>new TableRow({cantSplit:false,children:[left,right].map((items,j)=>cell([items[i]??new Paragraph({spacing:{line:20,before:0,after:0},children:[new TextRun({text:'',size:2})]})],widths[j]!,fills[j],i===0?140:30))}))});
    };
    if(d.body==='sidebar-left'||d.body==='sidebar-right'){
      const sw=Math.round((d.sideWidth??180)/515*10226),sideParas=[caption(locale==='en'?'PROFILE':'个人档案','FFFFFF'),...picture(true),...paragraphs(header.flatMap(b=>b.kind==='contact'?b.text.split(' | ').map(text=>({...b,text})):[b]),true,false,false,'FFFFFF'),...paragraphs(flat(side),true,false,false,'FFFFFF')],mainParas=[caption(locale==='en'?'CURRICULUM VITAE':'履历与作品'),...paragraphs(flat(main))];
      children=d.body==='sidebar-left'?[columnTable(sideParas,mainParas,[sw,10226-sw],[accent,undefined])]:[columnTable(mainParas,sideParas,[10226-sw,sw],[undefined,accent])];
    }else{
      children=[];
      if(d.header==='executive')children.push(line(accent),caption('PROFESSIONAL PROFILE'),line(d.secondary));
      if(d.header==='swiss')children.push(table([cell([caption('CV','FFFFFF')],950,accent,100),cell([caption('CURRICULUM VITAE')],9276,undefined,100)],[950,9276]));
      if(d.header==='academic')children.push(line(accent),caption(locale==='en'?'RESEARCH / CURRICULUM VITAE':'研究履历 / CURRICULUM VITAE'));
      if(d.header==='varsity')children.push(table([cell([caption('GRADUATE / 校园履历','FFFFFF')],10226,accent,140)],[10226]));
      if(d.header==='terminal')children.push(table([cell([caption('●  ●  ●     PROFILE / ENGINEERING','FFFFFF')],10226,accent,140)],[10226]));
      if(d.header==='portfolio')children.push(table([cell([caption('SELECTED WORK / PORTFOLIO')],7600,undefined,70),cell([caption('DESIGN','FFFFFF')],2626,accent,70)],[7600,2626]),line(accent));
      if(d.header==='newsprint')children.push(line(accent),new Paragraph({spacing:{before:30,after:80},children:[new TextRun({text:'THE CAREER JOURNAL',font,size:38,color:accent,bold:true})]}),line(accent));
      if(d.header==='collage')children.push(table([cell([caption('PERSONAL NOTES')],10226,d.secondary,130)],[10226]));
      if(d.header==='han')children.push(table([cell([caption(locale==='en'?'PERSONAL RECORD':'个人履历')],9326,undefined,70),cell([caption(locale==='en'?'CV':'履历','FFFFFF')],900,accent,70)],[9326,900]),line(d.secondary));
      if(d.header==='journey')children.push(caption('CAREER JOURNEY'),new Paragraph({spacing:{before:30,after:100},border:{bottom:{style:BorderStyle.SINGLE,color:d.secondary,size:7}},children:[new TextRun({text:'●                                       ●                                       ●',font,size:14,color:accent})]}));
      if(['ribbon','ledger','masthead','stack'].includes(d.header)){
        const cap=caption(locale==='en'?'CURRICULUM VITAE':d.header==='ribbon'?'个人简历  /  RESUME':'求职档案  /  PERSONAL RESUME',d.header==='ribbon'?'FFFFFF':accent);
        children.push(table([cell([cap],10226,d.header==='ribbon'?accent:d.tint,110)],[10226]));
      }
      const center=d.header==='center',fill=['frame','ticket','ledger','center','varsity','collage'].includes(d.header)?d.tint:d.header==='split'?accent:d.header==='terminal'?'18262D':undefined;
      const heads=paragraphs(header,false,center,false,['split','terminal'].includes(d.header)?'FFFFFF':undefined);
      if(center)children.push(table([cell([...picture(true),...heads],10226,fill,150)],[10226]));
      else if(photo){
        const left=d.photoSide==='left';
        children.push(left?table([cell(picture(),1900,d.header==='split'?d.secondary:fill,140),cell(heads,8326,fill,150)],[1900,8326]):table([cell(heads,8326,fill,150),cell(picture(),1900,d.header==='split'?d.secondary:fill,140)],[8326,1900]));
      }else children.push(table([cell(heads,10226,fill,140)],[10226]));
      children.push(line());
      if(d.body==='sequential'||d.body==='chronicle')children.push(...paragraphs(flat(ordered)));
      else if(d.body==='full')children.push(...paragraphs(flat(main)));
      else if(d.body==='rail'){
        main.forEach((section,i)=>{
          const groups:Block[][]=[];for(const b of section.blocks){if(b.kind==='entry'||!groups.length)groups.push([]);groups[groups.length-1]!.push(b);}if(!groups.length)groups.push([]);
          const h=paragraphs([section.heading],false,false,true,['tab','band'].includes(d.section)?'FFFFFF':accent);
          if(d.section==='number')h.unshift(new Paragraph({spacing:{after:50},children:[new TextRun({text:String(sectionNumbers.get(section.id)??i+1).padStart(2,'0'),size:46,bold:true,font,color:accent})]}));
          const width=d.section==='number'?1550:2060;
          children.push(new Paragraph({keepNext:true,spacing:{before:110,after:60,line:20},border:{bottom:{style:BorderStyle.SINGLE,color:d.secondary,size:5}}}));
          children.push(new Table({width:{size:10226,type:WidthType.DXA},columnWidths:[width,10226-width],layout:TableLayoutType.FIXED,borders,rows:groups.map((group,n)=>new TableRow({cantSplit:group.reduce((sum,b)=>sum+b.text.length,0)<1400,children:[cell(n===0?h:[],width,n===0&&['tab','band'].includes(d.section)?accent:undefined,70),cell(paragraphs(group),10226-width,undefined,70)]}))}));
        });
      }else{
        const balanced=d.body==='balanced',isLeft=d.body==='left';
        const sideList=balanced?balancedSections(ordered):side;
        const mainList=ordered.filter(s=>!sideList.includes(s));
        const mb=flat(mainList),sb=flat(sideList),mp=paragraphs(mb),sp=paragraphs(sb,!balanced);
        const sw=balanced?5113:Math.round((d.sideWidth??151)/515*10226),mw=10226-sw;
        const long=mb.length>30||sb.length>24||mb.reduce((sum,b)=>sum+b.text.length,0)>2000||sb.reduce((sum,b)=>sum+b.text.length,0)>950;
        if(!sb.length||!mb.length)children.push(...paragraphs(flat(ordered)));
        else children.push(isLeft?columnTable(sp,mp,[sw,mw],[d.tint,undefined],long):columnTable(mp,sp,[mw,sw],[undefined,d.tint],long));
      }
      if(['full','rail'].includes(d.body)&&side.length){
        const count=d.body==='full'?Math.min(3,side.length):2,width=Math.floor(10226/count);
        children.push(table(Array.from({length:count},(_,i)=>cell(paragraphs(flat(side.filter((_,j)=>j%count===i)),true),width,undefined,100)),Array(count).fill(width)));
      }
    }
  } else if(template==='modern') {
    const side = [...picture(),...paragraphs(header.flatMap(b=>b.kind==='contact'?b.text.split(' | ').map(text=>({...b,text})):[b]),true,false,false,'FFFFFF'),...paragraphs(flat(sections.filter(s=>sidebarSections.has(s.id))),true,false,false,'FFFFFF')];
    children=[table([cell(side,3000,'183D4B',240),cell(paragraphs(flat(sections.filter(s=>!sidebarSections.has(s.id)))),7226,undefined,270)],[3000,7226])];
  } else if(['classic','timeline','campus'].includes(template)) {
    const fill=template==='classic'?'283534':template==='campus'?'E7F0E9':undefined;
    const head=paragraphs(header,false,false,false,template==='classic'?'FFFFFF':undefined);
    children=[table([cell(head,photo?8426:10226,fill,250),...(photo?[cell(picture(),1800,fill,200)]:[])],photo?[8426,1800]:[10226]),new Paragraph({spacing:{after:80,before:0,line:80}})];
    const side=sections.filter(s=>sidebarSections.has(s.id) && !(template==='campus'&&s.id==='education'));
    const main=sections.filter(s=>!side.includes(s));
    if(template==='campus') main.sort((a,b)=>rank(['education','summary','projects','work'],a.id)-rank(['education','summary','projects','work'],b.id));
    const mainBlocks=flat(main), sideBlocks=flat(side);
    const mainParagraphs=paragraphs(mainBlocks), sideParagraphs=paragraphs(sideBlocks,true);
    const sideFill=template==='classic'?'F2F5E8':template==='campus'?'F0F6F1':'F0F4FC';
    const longColumns=mainBlocks.length>30 || sideBlocks.length>24 || mainBlocks.reduce((n,b)=>n+b.text.length,0)>2200 || sideBlocks.reduce((n,b)=>n+b.text.length,0)>900;
    if(!sideBlocks.length) children.push(...mainParagraphs);
    else if(longColumns) children.push(columns(mainParagraphs,sideParagraphs,sideFill));
    else children.push(table([cell(mainParagraphs,7340,undefined,170),cell(sideParagraphs,2886,sideFill,210)],[7340,2886]));
  } else {
    children=[table([cell(paragraphs(header),photo?8426:10226,undefined,0),...(photo?[cell(picture(),1800,undefined,0)]:[])],photo?[8426,1800]:[10226])];
    const extras=template==='editorial'?sections.filter(s=>['certificates','languages','awards','interests'].includes(s.id)):[];
    const ordered=template==='editorial'?[...sections.filter(s=>!extras.includes(s))].sort((a,b)=>rank(['summary','projects','work','skills','education'],a.id)-rank(['summary','projects','work','skills','education'],b.id)):sections;
    ordered.forEach((section,i)=>{
      children.push(new Paragraph({keepNext:true,spacing:{before:template==='editorial'?80:140,after:40,line:20},border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'D7DDE0'}}}));
      const heading=paragraphs([section.heading],false,false,true,template==='compact'?'FFFFFF':accent);
      if(template==='editorial') heading.unshift(new Paragraph({spacing:{after:40},children:[new TextRun({text:String(i+1).padStart(2,'0'),font,size:46,bold:true,color:accent})]}));
      const groups: Block[][]=[];
      for(const block of section.blocks){if(block.kind==='entry'||!groups.length)groups.push([]);groups[groups.length-1]!.push(block);}
      if(!groups.length)groups.push([]);
      children.push(new Table({width:{size:10226,type:WidthType.DXA},columnWidths:[1900,8326],layout:TableLayoutType.FIXED,borders,
        rows:groups.map((group,index)=>new TableRow({cantSplit:group.reduce((n,b)=>n+b.text.length,0)<1400,children:[cell(index===0?heading:[],1900,undefined,template==='editorial'?40:80),cell(paragraphs(group),8326,undefined,template==='editorial'?40:80)]}))}));
    });
    for(let i=0;i<extras.length;i+=2){
      children.push(new Paragraph({spacing:{before:80,after:60,line:20},border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'D7DDE0'}}}));
      const row=extras.slice(i,i+2).map(section=>cell([...paragraphs([section.heading],true,false,true),...paragraphs(section.blocks,true)],5113,undefined,60));
      if(row.length===1) row.push(cell([],5113));
      children.push(table(row,[5113,5113]));
    }
  }
  const document = new Document({
    creator: 'Super Resume', title: blocks[0]?.text ?? 'Resume', description: `Editable resume · ${template}`,
    ...(design?.section==='folded'&&design.paper&&design.paper!=='FFFFFF'?{background:{color:design.paper}}:{}),
    styles: {
      default: { document: { run: { font, size: 19, color: '202B34', language: { value: locale === 'en' ? 'en-US' : 'zh-CN', eastAsia: 'zh-CN' } }, paragraph: { spacing: { line: 310, after: 80 } } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font, size: 50, bold: true, color: '000000' }, paragraph: { keepNext: true } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font, size: 21, bold: true, color: accent }, paragraph: { keepNext: true } },
      ],
    },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: design?.section==='folded'?480:840, bottom: 1040, left: design?.section==='folded'?800:840, right: design?.section==='folded'?800:840, footer: 420 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: 16, color: '687681', font })] })] }) }, children,
    }],
  });
  return Packer.toBuffer(document);
}
