import engineering from '../../examples/resume.layout.zh-CN.json' with {type:'json'};
import portraits from '../../assets/samples/portraits.json' with {type:'json'};
import type { Resume } from '../core/resume.js';
const meta={sample:true,notice:'展示用虚构资料：姓名、学校、公司、经历、成果数字与人物照片均为示例，不代表真实求职者。照片由 AI 生成。'};
const marketing:Resume={
 basics:{name:'林知夏',label:'品牌与内容运营',email:'lin.demo@example.com',phone:'138 0000 0000',location:{city:'杭州'},image:portraits.female,url:'https://portfolio.example.com',summary:'围绕品牌内容、用户增长与活动运营开展工作，能把业务目标拆解为内容计划和复盘指标。重视用户洞察、跨团队沟通与可持续的内容积累。'},
 work:[{name:'青禾品牌工作室（虚构）',position:'品牌运营',startDate:'2023-07',endDate:'2025-12',highlights:['参与品牌内容策划，建立选题、拍摄、发布与复盘流程，协同设计及商务团队按周交付。','策划 12 场线上主题活动，整理用户反馈和转化数据，活动报名转化率由 8% 提升至 11%。','维护内容素材与品牌规范，累计沉淀 60 份选题脚本，减少重复沟通与临时返工。']},{name:'知行文化（虚构）',position:'新媒体运营实习生',startDate:'2022-07',endDate:'2023-03',highlights:['参与账号日常运营和社群答疑，完成热点跟踪、竞品内容分析和周报整理。','与编辑合作制作 24 篇原创内容，通过用户评论迭代选题方向。']}],
 projects:[{name:'城市漫游主题内容计划',roles:['项目策划与执行'],startDate:'2024-04',endDate:'2024-10',description:'围绕城市生活方式组织系列内容与线上互动，连接账号传播、社群参与和线下体验。',highlights:['设计内容主题与用户参与机制，协调 4 个合作方完成拍摄及活动落地。','统一活动数据口径，整理复盘手册，供后续项目复用。']}],
 education:[{institution:'明川大学（虚构）',studyType:'本科',area:'广告学',startDate:'2019-09',endDate:'2023-06'}],skills:[{name:'内容与增长',keywords:['内容策划','用户洞察','社群运营','活动执行']},{name:'工具与协作',keywords:['Excel','Figma','剪映','数据复盘']}],certificates:[{name:'数字营销课程结业',issuer:'示例学习项目',date:'2024-06'}],languages:[{language:'英语',fluency:'CET-6 · 工作沟通与资料阅读'}],meta
};
const design:Resume={
 basics:{name:'周予安',label:'视觉设计 / 品牌设计',email:'zhou.demo@example.com',phone:'139 0000 0000',location:{city:'上海'},image:portraits.male,url:'https://design.example.com',summary:'关注品牌识别、信息设计与数字体验，习惯从业务背景和用户场景出发完成视觉表达。能够独立推进方案、规范和交付物，并与产品、内容及开发团队协作。'},
 work:[{name:'山海设计事务所（虚构）',position:'视觉设计师',startDate:'2023-08',endDate:'2025-12',highlights:['参与品牌识别与线上传播设计，完成主视觉、活动物料和社交媒体内容的统一设计。','建立 30 个可复用视觉组件和交付规范，使日常物料制作时间缩短约 25%。']}],
 projects:[{name:'青屿生活品牌视觉升级',roles:['品牌视觉与设计规范'],startDate:'2024-02',endDate:'2024-08',description:'围绕品牌定位重组视觉语言，覆盖字体层级、色彩、包装与数字传播场景。',highlights:['从用户与竞品研究中明确设计方向，提交 3 组视觉提案并完成方案迭代。','交付品牌规范、包装版式与 18 个传播模板，支持后续内容团队独立使用。']},{name:'城市展览数字导览',roles:['信息架构与界面设计'],startDate:'2024-09',endDate:'2025-02',highlights:['梳理观展路径与内容层级，制作交互原型，并根据 12 位参与者的可用性反馈改进。']}],
 education:[{institution:'明川艺术学院（虚构）',studyType:'本科',area:'视觉传达设计',startDate:'2019-09',endDate:'2023-06'}],skills:[{name:'设计工具',keywords:['Figma','Illustrator','Photoshop','InDesign']},{name:'设计能力',keywords:['品牌识别','版式设计','原型设计','设计规范']}],languages:[{language:'英语',fluency:'设计资料阅读与交流'}],meta
};
const campus:Resume={
 basics:{name:'许晴',label:'市场营销 / 运营实习',email:'xu.demo@example.com',phone:'137 0000 0000',location:{city:'南京'},image:portraits.female,url:'https://works.example.com',summary:'市场营销专业应届生，参与校园活动策划、用户调研与内容制作。学习主动，能够完成资料整理、沟通协调与执行复盘，希望在真实业务中持续积累经验。'},
 education:[{institution:'明川大学（虚构）',studyType:'本科',area:'市场营销',startDate:'2022-09',endDate:'2026-06',courses:['消费者行为学','市场调研','数据分析','品牌管理']}],
 work:[{name:'星野生活（虚构）',position:'市场运营实习生',startDate:'2025-06',endDate:'2025-09',highlights:['协助完成新品用户调研，整理 120 份问卷并提炼常见需求，参与策划会议。','支持账号内容排期、活动物料准备与用户沟通，维护执行清单并跟进进度。']}],
 projects:[{name:'校园旧物循环计划',roles:['项目负责人'],startDate:'2024-09',endDate:'2025-01',description:'联合校园社团组织旧物交换与主题传播，负责方案、人员协调及效果复盘。',highlights:['协调 8 位同学分工，完成场地、报名、物资与现场引导安排。','活动吸引 160 位同学参与，整理意见问卷形成下一期的改进建议。']}],
 skills:[{name:'办公工具',keywords:['Excel','PowerPoint','问卷设计','基础数据分析']},{name:'内容制作',keywords:['Canva','剪映','活动策划','文案编辑']}],awards:[{title:'校级优秀学生干部',awarder:'示例院校',date:'2024-12'}],certificates:[{name:'普通话水平测试二级甲等',date:'2024-05'}],languages:[{language:'英语',fluency:'CET-6 · 日常交流'}],meta
};
const executive:Resume={
 basics:{name:'陆景行',label:'业务负责人 / 战略运营',email:'lu.demo@example.com',phone:'136 0000 0000',location:{city:'深圳'},image:portraits.male,summary:'以业务目标和客户价值为起点，组织团队完成年度计划、经营分析与跨部门协作。关注可持续增长、交付质量和团队能力建设。'},
 work:[{name:'远川科技（虚构）',position:'业务负责人',startDate:'2021-07',endDate:'2025-12',highlights:['协调 18 人团队推进年度经营计划，建立月度业务复盘及项目风险跟踪机制。','重构客户分层与服务流程，将项目按期交付率由 82% 提升至 94%。','联动产品、销售及交付团队，完成 6 个重点客户项目并建立可复用实施规范。']},{name:'启明咨询（虚构）',position:'战略运营经理',startDate:'2018-08',endDate:'2021-06',highlights:['统筹 3 条业务线的预算与数据分析，形成管理例会决策材料。','协同负责人优化业务流程，将月度报告准备时间减少约 30%。']}],
 projects:[{name:'客户服务体系升级',roles:['项目负责人'],startDate:'2024-03',endDate:'2024-11',highlights:['组织客户访谈，明确交付标准、关键节点和服务反馈机制。','推动销售、实施、售后共用信息台账，降低重复交接成本。']}],
 education:[{institution:'明川大学（虚构）',area:'工商管理',studyType:'硕士',endDate:'2018-06'}],skills:[{name:'业务能力',keywords:['经营分析','组织协作','项目管理','客户关系']}],languages:[{language:'英语',fluency:'商务沟通'}],meta
};
const academic:Resume={
 basics:{name:'沈若宁',label:'人机交互 / 用户研究',email:'shen.demo@example.com',location:{city:'北京'},summary:'研究方向为数字产品中的信息呈现与用户决策，结合访谈、实验和数据分析理解交互体验。关注研究过程的可复现性和结果的实际应用。'},
 education:[{institution:'明川大学（虚构）',area:'设计学',studyType:'硕士',startDate:'2023-09',endDate:'2026-06',courses:['人机交互','实验设计','统计分析']}],
 projects:[{name:'公共服务信息可读性研究',roles:['研究设计与数据分析'],startDate:'2024-03',endDate:'2025-06',highlights:['设计两轮任务实验，完成 36 位参与者的招募、测试与访谈整理。','使用 Python 分析完成时间与错误率，结合质性编码提出信息层级改进建议。']}],
 publications:[{name:'交互界面中的信息层级与任务理解（示例论文）',publisher:'明川学生研究论坛（虚构）',releaseDate:'2025-05',summary:'整理实验方法、分析流程及研究局限，完成论坛报告与资料归档。'}],
 skills:[{name:'研究方法',keywords:['访谈','实验设计','可用性评估']},{name:'分析工具',keywords:['Python','R','Figma']}],awards:[{title:'研究生学术交流奖（示例）',awarder:'明川大学（虚构）',date:'2025-12'}],languages:[{language:'英语',fluency:'学术阅读与报告交流'}],meta
};
export const specimens:Record<string,Resume>={marketing,design,campus,executive,academic,engineering:{...engineering,basics:{...engineering.basics,image:portraits.male},meta}};
export const specimenNames={marketing:'品牌运营',design:'视觉设计',campus:'应届实习',engineering:'技术工程',executive:'商务管理',academic:'学术研究'};
export function templateSpecimen(template:{specimen:string;showcasePhoto:boolean;layout?:string}){
 const value=structuredClone(specimens[template.specimen]??specimens.engineering!);
 // Shorter fictional showcases suit continuous and indexed layouts. Only demo
 // selection happens here; user resume rendering always retains every fact.
 const [header,body]=template.layout?.split('-')??[];
 if(['executive','swiss','academic','varsity','terminal','portfolio','newsprint','collage','han','journey'].includes(header??'')&&['sequential','chronicle','rail','full'].includes(body??'')){
  if(Array.isArray(value.work))value.work=value.work.slice(0,1);
  if(Array.isArray(value.projects))value.projects=value.projects.slice(0,1);
  if(Array.isArray(value.skills))value.skills=value.skills.slice(0,1);
  if(template.specimen==='campus'&&['sequential','chronicle'].includes(body??''))value.certificates=[];
 }
 if(!template.showcasePhoto&&value.basics)delete (value.basics as Record<string,unknown>).image;
 return value;
}
