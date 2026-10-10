import styles from './folded-styles.json' with { type: 'json' };
import type { Design } from './designs.js';

export type FoldedStyle = {
  id:string; name:string; header:Design['header']; accent:string; secondary:string; tint:string; paper:string;
  photoMode:'left'|'right'|'header'|'header-left'; identity:'plain'|'tint'|'ruled'; intent:'plain'|'tint';
  tag:'slash'|'double'|'bookmark'|'notch'|'outline'|'flag'|'chevron'|'edge'|'ticket'|'step';
  asset:string; start:number; columns?:number; priority?:'work'|'projects'|'education'|'summary'|'skills';
};
export const foldedStyles = styles as FoldedStyle[];
export const foldedStyleFor = (id: string) => foldedStyles.find(style => style.id === id) ?? foldedStyles[0]!;
export const foldedHeaderPhoto = (style:FoldedStyle) => style.photoMode.startsWith('header');
const descriptions: Record<string, [string, string]> = {
  'folded-navy': ['深蓝刊头 · 左侧肖像与双层折角', '深蓝反白页眉配金色斜切，照片置于基本信息左侧，求职意向使用浅色横条，双层折角标签串联通栏经历。'],
  'folded-jade': ['青竹框页 · 浅色档案与书签折角', '青绿竖边与框式页眉，右侧照片衔接浅绿信息卡，书签形折角栏目和细线组织教育、技能与经历。'],
  'folded-wine': ['绛红表格 · 居中刊头与切口栏目', '居中双线刊头、分格基本信息、右置照片和切口式栏目标签，通栏阅读结构适合完整履历。'],
  'folded-slate': ['石墨横签 · 页眉肖像与描边折角', '照片上移至横向页眉，基本信息紧凑排列，浅灰求职横条与描边斜角栏目留出更多正文空间。'],
  'folded-sand': ['米金书笺 · 居中抬头与左侧肖像', '米色纸面、居中书笺抬头与细金线，照片置左，旗形折角栏目连接单栏经历，整体温和清晰。'],
  'folded-cobalt': ['钴蓝侧章 · 几何页眉与箭形栏目', '蓝色斜切页眉与右上照片形成身份区，浅蓝基本信息卡、箭形栏目和连续单栏强调项目与工作经历。'],
  'folded-ink': ['墨金聘书 · 三段刊头与细格资料', '墨青刊头由金线和浅底分为三段，右侧照片、细线信息行及双层折角组织完整工作经历。'],
  'folded-silver': ['银蓝索引 · 左上照片与三列信息', '左上照片与字母索引并排，银蓝竖线划出页眉，三列基本信息、浅底意向及开边折角保持紧凑阅读。'],
  'folded-ivy': ['松绿学笺 · 学院框线与左侧照片', '松绿双线框式抬头配米白纸面，左侧照片嵌入浅色信息区，书签折角优先呈现教育与项目。'],
  'folded-campus': ['晴蓝校招 · 台阶刊头与三列资料', '蓝白台阶刊头配右上照片、三列浅色资料卡和票签折角，教育项目优先，适合校园实践展示。'],
  'folded-circuit': ['青黑智页 · 窗口刊头与技术项目', '青黑窗口式刊头、右上照片与青绿色细标，阶梯折角依次引出项目、技能和经历，保留通栏正文。'],
  'folded-peach': ['杏桃名片 · 左上肖像与错层色块', '杏桃色错层卡片衬托左上照片和右侧抬头，三列基本信息、切口栏目与个人简介形成清晰开场。'],
  'folded-press': ['黑白刊签 · 报刊横题与描边折角', '报刊式英文横题搭配左对齐中文抬头、细线侧注和右侧照片，描边折角使完整经历易于定位。'],
  'folded-lilac': ['雾紫便笺 · 叠页抬头与左侧照片', '雾紫叠页和短书签构成抬头，左侧照片配留白资料区、浅紫求职横条和旗形折角。'],
  'folded-vermilion': ['朱砂印记 · 方印页眉与右上照片', '朱砂小方印、米白纸面与金色细框组成中式页眉，右上照片和描边折角适配清晰的单栏履历。'],
  'folded-track': ['海青履程 · 节点页眉与贯穿时间线', '海青节点线连接页眉与左侧正文引导线，左侧照片、分行信息和箭形折角沿工作与项目经历展开。'],
};
const priorities:Record<string,string[]>={
  work:['work','projects','skills','education','summary'], projects:['projects','skills','work','education','summary'],
  education:['education','projects','skills','work','summary'], skills:['skills','work','projects','education','summary'],
  summary:['summary','work','projects','skills','education'],
};
export const foldedDesigns: Design[] = foldedStyles.slice(1).map(style => ({
  id: style.id, name: style.name, family: '通栏色带', category: '专业服务',
  subtitle: descriptions[style.id]![0], description: '折角系列。'+descriptions[style.id]![1],
  header: style.header as Design['header'], body: 'sequential', section: 'folded',
  accent: style.accent, secondary: style.secondary, tint: style.tint, paper: style.paper,
  photo: true, photoSide: ['left','header-left'].includes(style.photoMode) ? 'left' : 'right', specimen: 'engineering',
  order: style.priority ? [...priorities[style.priority]!,'awards','certificates','languages'] : style.id === 'folded-cobalt' ? ['projects','work','skills','education','summary','awards','certificates','languages'] : ['education','skills','work','projects','summary','awards','certificates','languages'],
}));
