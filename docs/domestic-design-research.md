# 国内风格模板与来源

0.7.1 提供 100 套版式。原有 24 套设计如下，另含 6 套基础版式；新增的 70 套见 [百套目录](template-catalog.md)。不同设计采用不同的页头、照片位置、主侧栏比例、栏目标记和信息顺序，不把单纯换颜色另算一套。

| 风格 | 新模板与 ID |
| --- | --- |
| 照片名片 | 薄荷名片 `mint-card`、玫瑰档案 `rose-profile`、海盐名片 `ocean-badge`、暖阳名片 `amber-profile` |
| 通栏色带 | 蓝金通栏 `navy-ribbon`、青竹目录 `jade-ribbon`、橙光焦点 `orange-ribbon`、绯红履历 `wine-ribbon` |
| 几何撞色 | 蓝调切角 `cobalt-corner`、青柠方阵 `lime-grid`、紫序分栏 `violet-split`、珊瑚拼色 `coral-block` |
| 清新文艺 | 青禾清新 `sage-garden`、浅紫手记 `lavender-note`、奶油书页 `cream-paper`、晴空蓝调 `sky-fresh` |
| 杂志作品 | 黑白主编 `mono-editor`、赤陶作品 `terracotta-folio`、靛蓝海报 `indigo-poster`、沙丘工作室 `sand-studio` |
| 表格档案 | 石墨档案 `slate-ledger`、青蓝矩阵 `teal-matrix`、酒红索引 `burgundy-index`、工程蓝图 `blueprint` |

定义在 `src/core/documents/designs.ts`，总目录在 `templates.ts`。`list_resume_templates` 可搜索名称、风格与职业方向。API 保留默认 `modern` 以兼容既有调用，推荐值与工作台初始选择为 `mint-card`。

## 国内平台与短视频研究

访问日期：2026-10-09。下面是实际查到的参考，不能解读为全网热度排名或商业模板的再分发授权。

| 来源 | 查阅内容与用途 |
| --- | --- |
| [抖音：如何快速制作简历](https://www.douyin.com/video/7589251190756478234) | 公开页面可检索的标题、互动数和文稿，讨论可画、照片、分栏、色彩与内容分区。浏览器直达曾跳转到推荐页，不把该次浏览算作完整视频观看。 |
| [B 站：最强简历攻略](https://www.bilibili.com/video/BV1NL4y1878J/) | 检索页面显示约 117.2 万播放，内容是简历案例分析与制作方法。播放量属于视频，不是某套模板的使用量。 |
| [可画中文简历模板](https://www.canva.cn/resumes/templates/) | 实际查看图库样张，页面当时显示 5,575 个模板。参考中文刊头、照片资料区、色带、几何构成和不同岗位的信息组织。 |
| [锤子简历创意分类](https://www.100chui.com/resume/chungyi1/) | 实际查看双栏创意、卡片、表格线条、明黄单栏等样张；该分类当时显示 21 项。参考结构差异，未复制图像、模板或代码。 |
| [锤子在线简历](https://www.100chui.com/resume/) | 查看岗位、风格分类与页面使用数，区分岗位范文数量和独立版式数量。 |
| [幻主简历](https://huanzhucv.com/) | 检索创意、橙色活力、左右栏等公开模板介绍，作为中文风格覆盖的补充。 |

此前的海外与开源参考见 [模板说明](templates.md)。本版是项目根据通用设计方向实现的版式，不宣称就是网上热门原版，没有搬运商业模板源文件、人物照片或视频。

## 岗位样张与照片

工作台提供品牌运营、视觉设计、应届实习、技术工程及商务管理、学术研究六种虚构示例。模板库使用各自的真实渲染样张；选择模板只换版式，不替换用户资料。“使用示例”是独立操作，有未保存编辑时会先确认。

示例人物由内置 ImageGen 生成，人物、机构、经历与成果数字均为虚构。压缩图片与完整生成提示见 `assets/samples/`，原图保存在 `artifacts/design-research/portraits/`。不会把示例照片自动加入用户新建的空白简历，也不请求外部图床。

100 套均可导出 PDF、可编辑 Word 和离线矢量 HTML。PDF 与 SVG 共用分页计划；Word 的换行、装饰和分页可能随编辑器变化。定稿版式以 PDF 为准。照片仍为可选项，没有照片不画空框，不虚构技能等级、成果或证书。具体验收和限制见 [验证记录](verification.md)。


## 0.7.1 跨风格扩充

本轮新增 10 个系列，每类 7 套；不只在原六类中换色。每系列具有独立页眉绘制，组合连续单栏、完整经历、主侧栏、等宽双栏、栏目索引和时间轨迹等正文结构。学术样张展示教育、研究和发表作品；管理样张突出团队与业务成果。都使用虚构资料，不推断用户具备这些经历。

2026-10-09 补查来源：

- [Canva：25 个简历设计](https://www.canva.cn/learn/25-inspiring-resume-designs/)：商务到创意排版方向。
- [Canva：个人简历分类](https://www.canva.cn/templates/s/personal-biography/)：中英文、教师、法务等不同需求。
- [Novorésumé 模板库](https://novoresume.com/resume-templates)：Executive、College、Tech、Academic、Creative 等类别。
- [Enhancv 模板库](https://enhancv.com/resume-templates/)：Ivy League、Crest、Polished 与多种阅读结构。
- [抖音：简历制作教程](https://www.douyin.com/video/7589251190756478234)：公开检索文稿中的分栏和模板筛选方法；未据此推断全网模板热度。

短视频搜索没有可验证的统一模板热榜。上述引用用于说明风格覆盖和通用排版思路；新中式、拼贴、终端、报刊等具体视觉由本项目实现，不声称是付费模板原件或热门排名。未搬运模板文件、商业素材或代码。
