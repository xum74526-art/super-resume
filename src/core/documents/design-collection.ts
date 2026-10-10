import type { Design } from './designs.js';

// Ten additional visual families, each with a dedicated header treatment.
// Explicit recipes change the reading structure as well as the visual palette.
const palettes = {
 navy:['24394D','B89C64','EDF1F5'], ink:['242829','A6ACAC','F0F1F0'],
 wine:['793E4B','B69B9D','F5ECEF'], forest:['315D4C','94B5A3','EAF2EC'],
 cobalt:['2249A0','9FB5DF','EEF2FA'], red:['A3332B','DC9388','F9ECE7'],
 teal:['256A69','8FBCB4','E9F4F0'], orange:['AD4C24','EBC87B','FBF1DC'],
 plum:['654F82','BAA8CF','F3EEF8'], rose:['965660','D7B4B6','F8EFF0'],
 sand:['715C45','B7A282','F5EDE0'], slate:['40546A','9AAFC3','EDF2F6'],
 lime:['344534','BAD276','F3F6E5'], brick:['8B463A','C99782','F6E9E1'],
} as const;
type Recipe = readonly [id:string,name:string,body:Design['body'],section:Design['section'],palette:keyof typeof palettes,photo?:'left'|'right'];
type Collection = {family:string;header:Design['header'];specimen:Design['specimen'];category:string;titleSize:number;description:string;recipes:Recipe[]};
const bodyNames:Record<Design['body'],string>={left:'左栏能力',right:'右栏能力',full:'宽幅履历',rail:'索引正文',balanced:'均衡双栏','sidebar-left':'左侧名片','sidebar-right':'右侧名片',sequential:'连续单栏',chronicle:'时间轨迹'};
const sectionNames:Record<Design['section'],string>={band:'整幅色带',tab:'短签分节',number:'编号分节',box:'框线栏目',line:'细线分节',icon:'圆点导航',double:'双线栏目',marker:'竖向标记',folded:'折角色签'};
const orders:Record<Design['specimen'],string[]>={
 marketing:['summary','work','projects','skills','education','certificates','languages','awards'],
 engineering:['summary','skills','work','projects','education','certificates','languages','awards'],
 design:['summary','projects','work','skills','education','certificates','languages','awards'],
 campus:['summary','education','projects','work','skills','awards','certificates','languages'],
 executive:['summary','work','projects','skills','education','certificates','languages','awards'],
 academic:['summary','education','projects','publications','work','awards','skills','languages','certificates'],
};
const collections:Collection[]=[
 {family:'商务高管',header:'executive',specimen:'executive',category:'商务管理',titleSize:31,description:'双线签名式页眉与克制的金属色细节，优先呈现管理经历、业务成果和专业能力。',recipes:[
  ['executive-signature','高管签名','full','line','navy'],
  ['executive-board','董事会简报','right','marker','ink','right'],
  ['executive-partner','合伙人履历','rail','number','wine'],
  ['executive-strategy','战略履历','left','double','forest','left'],
  ['executive-capital','资本视野','balanced','box','slate'],
  ['executive-brief','管理者提要','sequential','tab','navy'],
  ['executive-path','领航轨迹','chronicle','line','ink'],
 ]},
 {family:'瑞士国际',header:'swiss',specimen:'engineering',category:'国际求职',titleSize:37,description:'左对齐大字姓名、独立色块与严格网格，减少装饰并强化中英文信息的阅读顺序。',recipes:[
  ['swiss-red','苏黎世红','sequential','line','red'],
  ['swiss-grid','日内瓦网格','right','double','ink'],
  ['swiss-cobalt','巴塞尔蓝','rail','number','cobalt'],
  ['swiss-form','国际构成','balanced','marker','teal'],
  ['swiss-margin','白边秩序','left','line','slate'],
  ['swiss-type','字序','full','double','ink'],
  ['swiss-route','国际路径','chronicle','tab','red'],
 ]},
 {family:'学术研究',header:'academic',specimen:'academic',category:'学术科研',titleSize:28,description:'研究履历题头和文献式分节，教育、研究项目、发表作品与学术能力依次展开。',recipes:[
  ['academic-ivy','常青研究','sequential','double','forest'],
  ['academic-thesis','论文目录','rail','line','ink'],
  ['academic-lab','实验室手记','right','marker','cobalt'],
  ['academic-scholar','学者履历','full','line','navy'],
  ['academic-grant','研究计划','left','box','wine'],
  ['academic-field','田野记录','balanced','tab','sand'],
  ['academic-progress','研途','chronicle','number','slate'],
 ]},
 {family:'校招青春',header:'varsity',specimen:'campus',category:'应届实习',titleSize:32,description:'校园刊头、活力贴签与明快留白，教育和实践经历先于工作资历呈现。',recipes:[
  ['campus-spark','青春开场','right','band','orange','right'],
  ['campus-club','社团名片','left','marker','teal','left'],
  ['campus-launch','起跑线','full','tab','cobalt','right'],
  ['campus-honor','荣誉墙','balanced','box','wine','left'],
  ['campus-pass','校园通行证','rail','number','forest','right'],
  ['campus-next','下一站','sequential','icon','plum'],
  ['campus-steps','成长刻度','chronicle','line','orange'],
 ]},
 {family:'科技极客',header:'terminal',specimen:'engineering',category:'技术工程',titleSize:30,description:'深色终端式页眉、状态点与技术目录，突出技术栈、工程项目和可核验的交付成果。',recipes:[
  ['tech-terminal','终端档案','right','marker','forest'],
  ['tech-stack','技术栈','left','band','cobalt'],
  ['tech-source','源码索引','rail','number','teal'],
  ['tech-system','系统架构','balanced','box','slate'],
  ['tech-release','版本日志','chronicle','line','ink'],
  ['tech-protocol','协议手册','sequential','double','navy'],
  ['tech-console','控制台','full','tab','plum'],
 ]},
 {family:'作品提案',header:'portfolio',specimen:'design',category:'设计创意',titleSize:38,description:'作品提案封面式页眉、大字姓名和交错色块，项目、作品链接与设计过程优先展示。',recipes:[
  ['folio-proposal','作品提案','rail','number','orange','right'],
  ['folio-gallery','展厅','balanced','line','ink','left'],
  ['folio-concept','概念稿','right','box','cobalt','right'],
  ['folio-brand','品牌工作室','left','tab','wine','left'],
  ['folio-edition','限定版','full','double','forest'],
  ['folio-process','设计进程','chronicle','marker','brick'],
  ['folio-outline','创作大纲','sequential','line','plum'],
 ]},
 {family:'复古报刊',header:'newsprint',specimen:'marketing',category:'产品运营',titleSize:33,description:'报刊题头、双重分隔线与暖纸底色，以新闻栏目般的层级组织履历，正文保持清晰可读。',recipes:[
  ['press-daily','履历日报','balanced','double','ink'],
  ['press-column','人物专栏','rail','line','sand','right'],
  ['press-weekly','职业周刊','full','box','wine'],
  ['press-review','经历评论','right','double','forest','right'],
  ['press-byline','署名页','left','line','brick','left'],
  ['press-archive','报刊档案','sequential','tab','ink'],
  ['press-chronicle','职业纪事','chronicle','number','navy'],
 ]},
 {family:'手账拼贴',header:'collage',specimen:'campus',category:'应届实习',titleSize:31,description:'胶带式贴签、纸片层次与装订孔细节，将履历组织成清晰的手账页面。',recipes:[
  ['journal-tape','胶带手账','left','marker','rose','left'],
  ['journal-postcard','成长明信片','right','box','teal','right'],
  ['journal-scrap','灵感拼贴','balanced','tab','orange','left'],
  ['journal-notes','校园笔记','full','line','plum','right'],
  ['journal-tabs','彩签目录','rail','number','forest','right'],
  ['journal-letter','写给未来','sequential','double','sand'],
  ['journal-path','沿途收集','chronicle','icon','brick'],
 ]},
 {family:'新中式',header:'han',specimen:'design',category:'文化创意',titleSize:33,description:'朱印式方章、书册边线与疏朗题头，用现代横排组织个人经历和文化创意项目。',recipes:[
  ['han-vermilion','朱印','full','double','red'],
  ['han-bamboo','竹简','rail','marker','forest','right'],
  ['han-ink','墨白','right','line','ink','right'],
  ['han-jade','青玉书册','left','box','teal','left'],
  ['han-mountain','远山','balanced','tab','slate'],
  ['han-letter','笺书','sequential','line','sand'],
  ['han-scroll','行卷','chronicle','number','wine'],
 ]},
 {family:'时间叙事',header:'journey',specimen:'marketing',category:'产品运营',titleSize:31,description:'路线式页眉、阶段节点和时间刻度，用明确的先后层级呈现职业成长与项目推进。',recipes:[
  ['story-milestone','里程碑','chronicle','number','teal'],
  ['story-route','职业路线','rail','marker','navy','right'],
  ['story-chapters','职业章节','full','number','wine'],
  ['story-compass','成长坐标','right','icon','forest','right'],
  ['story-track','双轨经历','balanced','line','cobalt'],
  ['story-horizon','远方计划','left','tab','orange','left'],
  ['story-next','下一篇章','sequential','double','slate'],
 ]},
];
export const expandedDesigns:Design[]=collections.flatMap(c=>c.recipes.map(([id,name,body,section,palette,photoSide])=>{
 const [accent,secondary,tint]=palettes[palette];
 return {id,name,family:c.family,category:c.category,header:c.header,body,section,accent,secondary,tint,
  subtitle:`${c.family} · ${bodyNames[body]}与${sectionNames[section]}`,description:c.description,
  titleSize:c.titleSize,sideWidth:158,photo:!!photoSide,...(photoSide?{photoSide}:{}),
  ...(['newsprint','collage','han'].includes(c.header)?{paper:'FFFCF7'}:{}),
  order:orders[c.specimen],specimen:c.specimen};
}));
