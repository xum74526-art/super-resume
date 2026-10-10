# 验证记录

## GitHub 上传前验收 0.7.5

日期：2026-10-10。为 `xum74526-art/super-resume` 准备首次 GitHub 分发。README 与安装文档增加直接添加 Git marketplace 的命令，移除客户端说明中的开发机绝对路径。GitHub 分发无需 npm 账号；npm、MCP Registry 和平台官方公共目录尚未发布。

- 再次运行 `npm run release:pack`，30 项测试全部通过，并完成构建、分发清单检查、三种安装包的独立解压及 MCP/PDF/Word 导出回读验证。
- 上传清单共 263 个文件，包含完整插件 bundle、字体、装饰素材和第三方许可证。检查未发现私人参考资料、照片、开发机路径或凭据；依赖、缓存、生成文件和外部参考仓库均不进入 Git。
- 使用本机 Codex 与 Claude Code 的原生 CLI 帮助确认 `owner/repo` 形式的 Git marketplace 安装入口。该检查不等同于新的宿主模型 UI 会话。

## 当前验收 0.7.5

日期：2026-10-10。新增墨金聘书、银蓝索引、松绿学笺、晴蓝校招、青黑智页、杏桃名片、黑白刊签、雾紫便笺、朱砂印记、海青履程 10 套。折角系列累计 17 套，目录共 117 套、17 个风格分类。新增左上照片、三列基本信息、开边/票签/阶梯栏目，以及工作、项目、教育、技能或简介优先的内容排列。

- `npm run release:pack` 完整通过：类型检查、30 项测试、构建、分发校验、打包及三种安装包在项目外独立运行。自动测试覆盖全部 117 套 PDF/Word 事实保留、17 套折角的可选照片与多页 PDF；独立安装包实际导出并回读银蓝索引 PDF/DOCX。
- 用同一份私人参考数据导出新增 10 套 PDF、Word、HTML。Poppler 与 Documents 原始 `render_docx.py` 逐页渲染，全部 PDF 和 Word 参考预览均为一页；56 项原始内容值逐项核对保留。无照片最少信息、三列英文长链接、两页长经历均完成视觉检查，长经历 36 条事实全部保留。记录：`.cache/qa/0.7.5/verification.json`。Word 在无网络 LibreOffice 容器中验证，其他编辑器的字体与分页可能不同。
- 本地工作台 UI 实测搜索“折角”显示 17 套，分两页，第二页为 5 套；套用银蓝索引，实际下载并回读 PDF/Word。截图 `.cache/qa/0.7.5/studio-folded-search.png`，下载证据在 `artifacts/studio/0.7.5/`。
- Codex 和当前项目的 Claude Code local 安装升级至 0.7.5。Codex 原生 installed/enabled 均为 true，9 个工具可发现且 toolsError 为 null；Claude MCP Connected。两份安装副本各通过 22 次 MCP 调用，报告在 `artifacts/local-test/codex-0.7.5-MF4WLZ/report.json` 与 `artifacts/local-test/claude-0.7.5-vJa93q/report.json`。这是安装和协议验收，不等同于宿主模型 UI 会话；旧会话需要重新加载插件。
- 两份安装副本的程序、工作线程及 68 张无文字装饰与构建结果一致。三种本地安装包均检查不含个人参考资料及本机路径。输出位于 `artifacts/0.7.5/local/`，未公开发布。

## 历史验收 0.7.4

日期：2026-10-10。新增深蓝斜章、青竹折页、绛红档案、石墨横签、米金书笺、钴蓝侧章 6 套，与蓝金折角共 7 套参考风格模板。目录为 107 套、17 个分类；工作台及 MCP 均可搜索“折角”。页眉、照片位置、信息区和栏目造型不同，钴蓝侧章优先呈现项目与工作。

- `npm run release:pack` 完整通过：类型检查、30 项测试、构建、分发校验、打包，以及三种安装包在项目外独立运行。自动测试覆盖全部 107 套 PDF/Word 的事实保留、所有折角模板的多页导出与可选照片；独立安装包实际导出、回读钴蓝侧章 PDF/DOCX。
- 7 套参考预览均生成 PDF、可编辑 Word 和 HTML。使用 Poppler 和 Documents 原始 `render_docx.py` 渲染并逐页查看；7 套 PDF 与 Word 渲染均为一页，56 项原始内容值均核对保留（忽略分页空白及字体提取中的等价圆点差异）。无照片最少资料、英文长链接和两页长经历也完成检查，长经历 36 条事实全部保留。记录：`.cache/qa/0.7.4/verification.json`。
- 浏览器实际搜索“折角”显示 7 套，套用钴蓝侧章后下载 PDF 和 Word 并回读成功。截图 `.cache/qa/0.7.4/studio-folded-search.png`，下载文件在 `artifacts/studio/0.7.4/`。这是本地工作台 UI 验证。
- Codex 与当前项目的 Claude Code local 安装均升级至 0.7.4。Codex installed/enabled 为 true，9 个工具可发现且 toolsError 为 null；Claude MCP Connected。两份安装副本各通过 22 次 MCP 调用，报告在 `artifacts/local-test/codex-0.7.4-6SBGz6/report.json` 与 `artifacts/local-test/claude-0.7.4-bZZ26L/report.json`。这不等同于宿主模型 UI 会话测试，旧会话需重新加载插件。
- 本地安装包位于 `artifacts/0.7.4/local/`。安装副本的程序和 28 张无文字装饰与构建结果一致，三种安装包均检查不含个人参考资料和本机路径。未公开发布。

## 历史验收 0.7.3

日期：2026-10-10。新增 `bluegold-classic`（蓝金折角），目录为 101 套、17 个风格分类。参考版式以新的矢量图形和可编辑 Word 段落实现，个人参考文档、联系方式及照片不进入安装包。同时修复 pdf-lib 读取非零偏移 Node Buffer 时 JPEG 导出偶发失败的问题。

- `npm run release:pack` 完整通过：类型检查、29 项测试、构建、分发校验、打包及三种安装包的项目外独立验收。验收覆盖全部 101 套 PDF/Word 事实保留；安装包验收实际导出并回读「蓝金折角」，确认 Word 装饰资源完整。
- 用 Poppler 和 Documents 原始 `render_docx.py` 检查新模板的中文参考、中英文示例、无照片最少资料及两页长经历。逐页查看页面图片；参考 PDF 和 Word 渲染均为一页，两页长经历的 36 条事实均保留。Word 在无网络 LibreOffice 容器中验证，未声称所有 Word 编辑器分页完全相同。检查记录为 `.cache/qa/0.7.3/verification.json`。
- 浏览器实际选择「蓝金折角」，确认 101 套/17 类入口和预览更新，点击下载 PDF、Word 并保存到 `artifacts/studio/0.7.3/`。截图为 `.cache/qa/0.7.3/studio-bluegold.png`；这部分是工作台 UI 验证。
- Codex 原生插件升级至 0.7.3，返回 installed/enabled 均为 true，9 个工具可发现，toolsError 为 null。Claude Code 当前项目的 local 安装升级至 0.7.3，MCP 健康检查 Connected。实际安装副本分别通过 21 次 MCP 调用，报告为 `artifacts/local-test/codex-0.7.3-uUb1xe/report.json` 和 `artifacts/local-test/claude-0.7.3-09CWeu/report.json`。客户端安装与协议验收不等于宿主模型 UI 会话；旧会话需重新加载插件。
- 本地包位于 `artifacts/0.7.3/local/`；未配置发布者身份，也未公开发布。

## 历史验收 0.7.2

日期：2026-10-10。本轮整理可独立安装的插件，新增含中文说明的市场安装包和单插件 README。版本、Codex / Claude Code 清单与 Registry 模板同步为 0.7.2，源包仍为私有，未配置公开发布身份。

- `npm run release:pack` 完整通过：类型检查、26 项测试、构建、分发校验、打包和项目外独立验收。输出目录为 `artifacts/0.7.2/local/`，包含市场 ZIP、单插件 ZIP、npm tarball、文件清单和 SHA-256 校验和。
- 三种包均在系统临时目录解压，不安装依赖，实际完成 MCP 握手、9 个工具发现、模板预览、中文 PDF/DOCX 导出回读及文件命令导出。新检查覆盖两个市场清单的相对路径、市场包与单插件包逐文件一致性、校验和，以及禁止开发目录和环境文件进入分发包。
- Claude Code 原生 `plugin validate` 通过市场包清单验证。Codex 原生命令升级至 0.7.2 并启用；Claude Code 当前项目的 local 安装升级至 0.7.2，健康检查为 Connected。
- Codex 与 Claude Code 的实际安装副本分别通过 20 次 MCP 调用，覆盖全部 9 个工具。报告为 `artifacts/local-test/codex-0.7.2-4e7vXQ/report.json` 和 `artifacts/local-test/claude-0.7.2-dsL01z/report.json`。
- Codex app-server 返回 `localVersion=0.7.2`、`installed=true`、`enabled=true`，9 个工具可发现且 `toolsError=null`。这验证安装与协议调用，不代表本轮进行过宿主模型驱动的 UI 会话。已有客户端会话需要重新开启以加载新版。
- 文档工作线程 SHA-256 与 0.7.1 完全一致（`741F672531CE2AEF12E644AB008755E0D952336912032A667ACE500D04779246`）。模板排版沿用下面 0.7.1 的视觉验收，本轮没有重新进行百套文档或浏览器视觉检查。

尚未发布到 GitHub、npm 或 MCP Registry。其他智能体需自行安装或配置 MCP，不会自动接收插件。安装步骤见 [插件安装说明](plugin-install.md)。

## 历史验收 0.7.1

日期：2026-10-10。目录扩展为 100 套：原有 30 套保留，新增 10 个风格系列各 7 套，合计 16 个设计系列及基础版式，共 17 个筛选分类。新增商务高管、瑞士国际、学术研究、校招青春、科技极客、作品提案、复古报刊、手账拼贴、新中式和时间叙事。完整名称、ID 和版式说明见 [模板目录](template-catalog.md)。

- 类型检查、全部 26 项测试和构建通过。`npm run release:pack` 在分发校验阶段发现 skill 文件换行格式不符；统一为 LF 后，分发校验、打包及项目外独立验收均通过。ZIP/npm 包解压后无需安装依赖即可完成 MCP 握手和中文 PDF/DOCX 导出回读。最终本地包位于 `artifacts/0.7.1/local/`。
- 全部 100 套生成 PDF、DOCX、JSON 岗位样张，另生成全部 100 套长简历。短样张在 `artifacts/samples/0.7.1/`，长简历及目录在 `.cache/qa/0.7.1/`。六类岗位示例均为虚构；连续单栏等布局使用较短的展示履历，实际用户导出始终保留所提供的全部事实。
- Poppler 渲染全部 100 套 PDF 样张和 18 套代表性长简历，共 136 页；Documents 原始 `render_docx.py` 在关闭网络的 LibreOffice 容器中渲染对应的 118 份 Word 文件，共 136 页。检查所有页面图，修正分栏内容分配、页头与时间线装饰、窄栏标题间距及栏目编号顺序。三套 Word 样张的末栏续页问题通过调整双线栏目的边框间距修复。最终全部展示样张均为一页。
- 18 套实际渲染后的 Word 长简历各为两页，9 个经历标题与全部 36 条事实完整，经历标题与首条内容同页。Word 采用可编辑表格与段落，部分装饰和分页与 PDF 有差异；验收基于 LibreOffice，未测试 Microsoft Word 桌面应用。任意长度的用户履历可能续页，不承诺所有内容都能排在一页内。
- 浏览器验证 100 套模板、17 类筛选、9 页跳转以及最后一页 4 套版式；新中式与手账拼贴筛选均显示 7 套。套用朱印后仍保留原来的林知夏示例，实际下载 PDF 与 Word 并回读，姓名、两段工作经历、项目、教育、技能和语言均保留。下载证据为 `artifacts/studio/styles-download-0.7.1.pdf` 和同名 `.docx`。
- 浏览器检查 1280px 桌面与 390px 窄窗口，风格筛选区可滚动，分页与套用可操作。界面证据为 `artifacts/studio/styles-library-0.7.1.png` 和 `styles-library-narrow-0.7.1.png`。结束前恢复默认窗口并保留模板库。
- Codex 与 Claude Code 本地插件均更新至 0.7.1。两个实际安装副本各通过 20 次 MCP 调用，覆盖全部 9 个工具及新模板检索、预览和 PDF/DOCX 导出。报告位于 `artifacts/local-test/codex-0.7.1-k6f2sL/report.json` 和 `artifacts/local-test/claude-0.7.1-tKXMPd/report.json`；主程序与文档工作线程 SHA-256 均与最终构建一致。
- 原生 Codex app-server 确认本地版本 0.7.1、已安装且启用、9 个工具可发现且 `toolsError=null`；Claude Code MCP 健康检查为 Connected。未启动宿主模型驱动的完整会话；已有客户端会话需要重新打开来加载新版。

模板为本项目实现，网络资料用作风格参考，不宣称热门排名或招聘效果。发布身份仍待配置，本轮只生成本地包，未发布到 npm、MCP Registry 或 GitHub。

## 历史验收 0.6.1

日期：2026-10-09。新增 24 套国内风格设计，总目录 30 套。短视频与国内图库来源、使用方式和完整模板 ID 见 [研究记录](domestic-design-research.md)。0.6.1 同步修正 MCP 工具及安装包说明中的旧数量；文档渲染器与完成视觉验收的 0.6.0 SHA-256 完全一致。

- `npm run release:pack` 通过类型检查、全部 26 项测试、构建、分发校验及 ZIP/npm 包在项目外的独立 MCP 预览和 PDF/DOCX 导出回读。最终本地包位于 `artifacts/0.6.1/local/`，未公开发布。
- 全部 30 套生成 PDF、DOCX、JSON 岗位样张，另生成全部 30 套长简历。样张位于 `artifacts/samples/0.6.0/`；每套 PDF 样张 1 页、长简历 2 页，目录与长简历在 `.cache/qa/0.6.0/`。
- Poppler 渲染 30 套 PDF 样张，并检查覆盖主要布局的 8 套长简历，共 46 页。Documents 原始 `render_docx.py` 在关闭网络的 LibreOffice 容器中渲染同样的 30 套样张与 8 套长简历，共 46 页，逐页查看生成图片。修正了照片段落对齐、页头装饰与换行、补充栏目分区和空侧栏回退；样张均为一页。
- 8 套实际渲染后的 Word 长简历各为两页，9 个经历标题和 36 条事实完整，标题与首条内容同页，第一段经历位于第一页。没有把所有字段组合都纳入视觉验收；长简历可跨页，不通过截断内容强塞一页。
- 浏览器实际验证 12 + 12 + 6 的模板分页、几何撞色筛选（4 项）、叠加设计创意方向（2 项）、无结果搜索及模板套用。选择视觉设计示例，修改姓名后切换赤陶作品，预览保留修改；实际下载 PDF、Word、JSON，保存后新建并重新打开 JSON，回读确认姓名、项目、工作和技能保留，照片仍为嵌入数据。
- 浏览器证据位于 `artifacts/studio/domestic-library-0.6.0.png`、`domestic-library-narrow-0.6.0.png` 和 `domestic-download-0.6.0.*`。检查 1280px 桌面和 390px 窄窗口，按钮与筛选可用，未见横向内容溢出；浏览器警告和错误日志为空。验收后恢复默认窗口，重新载入虚构示例并保留模板库。
- Codex 与 Claude Code 本地插件均已升级到 **0.6.1**。两个实际安装副本分别通过 20 次 MCP 调用，覆盖全部 9 个工具和新模板检索、预览、导出。报告为 `artifacts/local-test/codex-0.6.1-I7qeUx/report.json` 和 `artifacts/local-test/claude-0.6.1-ejLfDZ/report.json`。主程序、文档工作线程的安装副本 SHA-256 均与最终构建一致。
- 原生 Codex app-server 确认版本 0.6.1、已启用、9 个工具可发现且 `toolsError=null`；Claude Code 健康检查为 Connected。插件 skill 通过 `quick_validate.py`。未启动宿主模型驱动的完整会话；已有会话需重新打开来加载更新。

Word 验收使用 LibreOffice，不代表 Microsoft Word 桌面实测。Word 采用可编辑表格与段落，部分边角装饰、换行和分页与 PDF 有差异；固定版式请使用 PDF。国内来源作为设计参考，未复制商业模板文件，也不宣称热门排名、ATS 通过率或招聘效果。样张人物由内置 ImageGen 生成，履历与数字均为虚构；[生成说明和提示词](../assets/samples/README.md) 随项目保存。发布身份仍待配置，尚未发布到 npm、MCP Registry 或 GitHub。

## 历史验收 0.5.2

日期：2026-10-09。本轮撤下旧社区模板库，重新实现六套结构不同的原生模板：曜石、锋芒、脉络、刊页、新芽、格致。参考来源和设计取舍见 `docs/templates.md`；这些是本项目实现的版式，不宣称为商业模板原件或热门排名。

- 旧模板已从工作台、MCP 检索和新分发包中撤下，源码与来源记录移至 `references/retired/theme-library-0.4.1/` 供历史追溯。六套新模板均支持 PDF、可编辑 DOCX 和 HTML，使用实际渲染的 SVG 缩略图。
- 工作台增加可选照片、作品链接、证书、奖项、语言等编辑项。测试照片仅在本地处理，样例履历及量化成果均为虚构；用户原始 JSON 和事实在模板切换、保存与导出中保留。
- `npm run release:pack` 通过类型检查、全部 26 项测试、构建、分发清单校验，以及 ZIP/npm 包在项目外解压后的独立 MCP 调用。当前本地包位于 `artifacts/0.5.2/local/`，没有公开发布。
- 浏览器实际完成六套模板显示、搜索、方向筛选、无结果状态、模板选择、姓名和岗位编辑、添加照片、保存并重新打开 JSON、下载 PDF 与 Word。六张真实缩略图均加载成功；1280px 桌面、390px 窄窗口及默认侧栏检查没有横向溢出，浏览器警告与错误日志为空。完成后恢复默认窗口尺寸并保留模板库页面。
- 当前界面截图：`artifacts/studio/curated-library-0.5.2.png` 和 `curated-library-lower-0.5.2.png`；窄窗口证据为 `curated-library-narrow-0.5.1.png`，其界面与 0.5.2 相同。单页样例位于 `artifacts/samples/0.5.2/`。
- 六套模板各生成单页和两页压力样例。PDF 使用 Poppler，DOCX 使用 Documents 原始 `render_docx.py` 在隔离 LibreOffice 环境中渲染；检查共 18 页 PDF 和 18 页 Word 的版面。修正了 Word 首页面只有页头、经历标题与首条内容分离以及照片裁切问题。最终每套压力样例均保留 9 个经历标题及全部 36 条事实，标题和首条内容同页，第一段经历从第一页开始。
- 另检查带完整侧栏的三页 Word 压力样例及带照片的 PDF/Word。最终浏览器下载文件 `artifacts/studio/curated-download-final.docx` 的正文 XML、图片清单和图片字节，与已渲染检查的修复版完全一致。旧 `curated-download.docx` 是修复前证据，不作为当前交付。
- Codex 与 Claude Code 原生命令成功升级本地插件至 0.5.2。两个实际安装副本各通过 20 次 MCP 调用，覆盖全部 9 个工具及模板检索、预览和导出。报告分别位于 `artifacts/local-test/codex-0.5.2-PCkSJn/` 和 `artifacts/local-test/claude-0.5.2-X7b6WG/`。安装副本的主程序与文档工作线程 SHA-256 均与最终构建一致。
- 原生 Codex app-server 确认插件已启用、版本为 0.5.2、全部 9 个工具可发现且 `toolsError=null`；Claude Code MCP 健康检查为 Connected。未启动模型驱动的客户端完整会话，已有会话需要重新打开以加载更新。

Word 验收基于 LibreOffice，未验证 Microsoft Word 桌面应用。可编辑 Word 的换行、间距和装饰与 PDF 可能不同，完整侧栏的长简历也可能占用更多页面；需要固定版式时使用 PDF。没有验证任意字段组合或所有第三方编辑器，也不承诺 ATS 通过率或招聘效果。发布者身份仍未配置，尚未发布 npm、MCP Registry 或 GitHub。

## 历史验收 0.4.1

日期：2026-10-09。本轮加入离线社区模板库、搜索筛选、真实 HTML 缩略图及社区模板导出。下方旧记录保留为历史，不代表本轮重新进行了全部旧版视觉检查。

- 从 npm 下载 277 个 JSON Resume 主题源码包，另固定 Awesome HTML Resume Templates 的 20 套模板，共 297 个源码来源。完成许可证、校验和和来源记录；其中 192 个社区模板通过兼容性适配，加上 3 套内置版式，共 195 个可选项。同源分支仍会计为不同包，不宣称全部都是独立设计。105 个未接入来源的原因见 `references/themes/compatibility.json`。
- `npm run release:pack` 通过类型检查、全部 26 项测试、构建、分发清单校验，以及 ZIP/npm 包在项目目录外解压后的独立 MCP 验证。测试覆盖全部 192 个社区模板的完整中文样例和最小资料、原始事实不变、HTML 清理、检索分页、来源信息、路径拒绝以及 HTML 预览与实际文件导出。产物位于 `artifacts/0.4.1/local/`，仍为未公开发布的本地包。
- 浏览器实际检查模板库翻页、内置/社区筛选、无结果搜索、Ats Friendly 与 Anthonyjdella Caffeine 套用、内容编辑后预览更新、HTML 下载和 JSON 保存。回读浏览器下载的 HTML，确认编辑后的姓名、职位、公司和项目存在且无脚本；样例为虚构资料，证据文件在 `artifacts/studio/community-download.html`。
- 桌面 1280px 与窄窗口 390px 检查没有横向溢出，模板卡片可滚动、分页与关闭按钮可用，浏览器错误日志为空。截图在 `artifacts/studio/template-library.jpg` 和 `artifacts/studio/template-library-narrow.jpg`。结束前恢复默认窗口尺寸并保留社区模板库页面。
- Codex 与 Claude Code 原生命令均成功更新到 0.4.1，两个安装缓存的主程序及文档工作线程 SHA-256 与本轮构建一致。分别针对实际安装副本执行 20 次 MCP 调用，全部 9 个工具和社区 HTML 预览/文件导出通过。报告在 `artifacts/local-test/codex-0.4.1-dPHNzW/` 和 `artifacts/local-test/claude-0.4.1-TkWsXJ/`。
- 原生 Codex app-server 确认 0.4.1 已启用且发现全部 9 个工具，`toolsError=null`；Claude Code MCP 健康检查为 Connected。未启动模型会话，已有客户端会话需要重新打开以加载更新。

192 个社区模板支持 HTML 导出与浏览器打印，未实现对应的可编辑 DOCX；直接 PDF/DOCX 导出仍限于 3 套内置版式。本轮未逐套人工检查全部社区模板的视觉效果、所有字段组合或打印分页，不能用自动文本检查替代这些检查。模板不支持的字段会提示，原始 JSON 保留完整内容。上架身份仍未配置，未发布 npm、MCP Registry 或 GitHub。

## 历史验收 0.3.0

日期：2026-10-09。当前新增三种模板、SVG 分页预览和本地模板工作台。此前 0.2.1 的记录保留在下方，不能替代本版本的验证。

- `npm run release:pack` 通过：类型检查、23 项测试、构建、分发清单校验，以及 ZIP/npm 包解压到项目外后的实际 MCP 握手、预览和 PDF/Word 导出回读。当前产物在 `artifacts/0.3.0/local/`，仍是未发布的本地测试包。
- 三种模板分别生成单页样例与两页压力样例。PDF 使用 Poppler 渲染，Word 使用 Documents 原始 `render_docx.py` 在隔离 LibreOffice 容器中渲染；逐页检查全部 9 张 PDF 页面和 9 张 Word 页面，未发现裁切、重叠或缺字。样例在 `artifacts/samples/0.3.0/`，中间文件在 `.cache/qa/templates/`。
- 紧凑模板初次 Word 压力检查发现左栏标题的 keepNext 导致整段移页，并拆开一段经历标题与内容。修正左栏段落保持规则后，三种模板均为两页、9 个经历标题都与首条证据同页、36 条事实完整。此检查针对实际渲染后的文件运行，见 `scripts/qa/run-word-qa.ps1`。
- 在实际浏览器工作台完成三种模板切换、姓名/求职方向修改、PDF 与 Word 下载、JSON 保存、新建与重新打开 JSON。回读浏览器下载的 Word 确认新姓名和职位进入文件。界面截图在 `artifacts/studio/`；所有输入均为虚构测试内容。
- 检查桌面与 390px 窄窗口，三种模板均可直接选择，窄窗口没有横向溢出；浏览器错误日志为空。保存 JSON 后状态改为已导出，切回示例不再提示存在未保存修改。结束验收前已恢复浏览器默认窗口尺寸并保留可试用页面。
- PDF 与预览采用同一分页计划。测试验证模板版式不同、内容事实保留、页数一致、SVG 不含外部资源或可执行简历文本。工作台请求测试覆盖模板校验和跨来源请求拒绝。
- Codex 和 Claude Code 的本地插件均已升级至 0.3.0。对两个实际安装缓存各执行 18 次 MCP 调用，覆盖全部 9 个工具并通过。报告分别在 `artifacts/local-test/codex-0.3.0-06hqpj/` 和 `artifacts/local-test/claude-0.3.0-Uq4Rrt/`。
- 原生 Codex app-server 发现启用的插件和全部 9 个工具，`toolsError=null`；Claude Code 的 MCP 健康检查为 Connected。没有启动模型会话。已有客户端会话需要重新打开以加载新版插件。

本版本尚未验证 Microsoft Word 桌面端的所有字体组合、宿主模型自主完成全流程、公网部署或公开目录安装。尚无 OCR、照片排版、自定义主题色、模板商城或持久经历库。MCP Registry/npm 尚未发布，发布身份仍未配置。

## 历史验收 0.2.1

下列记录对应此前 0.2.1。执行环境：Windows，Node.js 24.14.0 与 22.23.3；隔离 Debian 容器，Node.js 22.23.3。

## 已完成

- 运行时依赖从官方 npm registry 安装并固定在 package-lock.json；本次依赖审计通过。
- `npm run release:pack`：类型检查、19 项测试、主程序与工作线程构建、清单校验、打包和解压运行检查全部通过。
- Windows Node.js 22.23.3 单独执行相同 19 项测试，全部通过；解压包验收同时覆盖 Windows Node.js 24 与 Linux Node.js 22。
- 核心测试覆盖结构校验、revision、修改原子性、保留原数据、原型路径拒绝、中英文关键词、原文偏移和结果大小限制、导出与输入上限。
- 官方 MCP SDK 客户端实际完成 stdio / Streamable HTTP 握手、工具/资源/提示词发现及工具调用。
- 发布配置在独立临时夹验证：Registry schema 合法、版本一致、错误身份被拒绝、源码包维持 private。测试身份没有写入本项目发布配置，也没有进行联网发布。
- ZIP 与 npm tarball 解压到项目目录之外，不安装依赖，均成功握手、调用 7 个工具中的目标工具，完成中文 PDF/DOCX 导出与回读。另验证 CLI 文件导入、导出和默认拒绝覆盖；临时目录已清理。
- 同一 0.2.1 ZIP 与 npm tarball 在无网络 Linux 容器中再次通过上述独立包检查。测试驱动使用只读挂载的 SDK，实际启动的解压包不依赖项目 node_modules。
- `claude plugin validate ./plugins/super-resume` 与 `claude plugin validate .`：通过，无警告。
- Skill Creator 的 `quick_validate.py`：使用已具备 PyYAML 的 Python 以 UTF-8 模式验证通过；内置 Python 缺少 PyYAML 的首次尝试未成功，不计入通过记录。
- `npm audit --omit=dev --audit-level=high`：本次查询报告 0 个已知漏洞；这不等同于完整安全审计。
- 四个上游 checkout 延续 0.1.0 的固定提交，本轮未修改。
- Git 忽略规则确认排除了参考 checkout、node_modules、dist 和 artifacts。

## 文档专项

- 真实生成一页中文 PDF 和可编辑 DOCX；姓名、日期、中英文关键词、扩展字段回读成功，输入对象未被修改。
- 中文 PDF 使用按实际字形嵌入的 Noto Sans CJK SC；检查 PDF 字体字典确认嵌入字形流与 ToUnicode 映射。
- 一页样例及两页压力样例使用内置 Poppler 渲染，逐页查看 PNG，文字、页边距、分页、页码正常，无裁切或重叠。多页测试确认首尾记录完整。
- Word 自动检查确认可编辑文本、标题样式、中文字体声明、A4 尺寸、keepNext 和无外部关系。
- Word 单页样例和两页压力样例使用 Documents 的原始 `render_docx.py` 在独立 Docker 环境中渲染，逐页查看全部 3 张 PNG。容器使用 LibreOffice、Noto CJK 与 Liberation 字体，未调用用户桌面 Office。中文、边距、页码、行距正常，无裁切或重叠。
- 视觉检查曾发现公司 6 的标题和日期留在上一页、首条内容移到下一页。0.2.1 修复日期/链接段的分页保持规则；渲染回归检查在旧文件上确实失败，新文件上通过：9 段经历的标题与第一条内容同页，36 条事实完整。复现入口见 `scripts/qa/run-word-qa.ps1`。
- 输入防护覆盖损坏文件、非法 base64、DTD、ZIP 展开超限、PDF 页数上限、无文本页和未知字形；修订删除内容与字段指令不会作为当前事实导入。
- 样例：`artifacts/samples/resume-demo.pdf`、`resume-demo.docx`。样例均为虚构，不代表真实用户履历。多页源文件和检查图在 `.cache/qa/`。

## 原生客户端

- Codex CLI `0.162.0-alpha.2`：通过 `plugin marketplace add` 注册本地市场，`plugin add` 安装并升级到 0.2.1；列表显示 installed / enabled 均为 true。独立 app-server 的 `plugin/read` 发现启用的工作流，`mcpServerStatus/list` 从该插件发现全部 7 个工具且 `toolsError` 为 null。没有创建模型会话。
- Claude Code `2.1.114`：在当前项目使用 `--scope local` 安装、升级到 0.2.1；`plugin list --json` 显示 enabled 为 true，`claude mcp list` 显示插件 MCP 为 Connected。项目本地配置已忽略，不进入 Git 或发布包。
- 两者均使用原生命令管理安装状态，没有覆盖现有配置文件。Codex 本地市场和启用状态已经写入用户配置；Claude 插件仅在当前项目启用。已有客户端会话可能需要重新打开才能加载新版本。

## 发布状态

发布者身份仍未配置：缺少 GitHub 仓库、npm scope、发布者名称及自有代码许可。此前 `npm run release:check` 因该条件按预期失败。当前生成的是本地测试包，没有发布到 npm / MCP Registry，也没有推送 GitHub。账号准备方法已写入发布指南。

## 本地完整流程复测

用户要求本地试用后，使用 Windows 内置 Node.js 24.19.0，直接针对两个客户端已安装的 0.2.1 缓存副本运行 `scripts/test-local-flow.mjs`，不是从源文件导入业务函数。插件工作目录设为独立输出目录，避免依赖源码目录。

- Codex 缓存副本和 Claude Code 缓存副本各完成 16 次 MCP 调用，覆盖全部 7 个工具，共 32 次，均符合预期。
- 从空简历填入虚构示例，校验、匹配岗位、修改简介、再次校验，再导出 JSON、Markdown、PDF、DOCX。PDF 和 Word 均实际导入，姓名、公司、项目、学历、日期和技能文本完整。
- 3 组岗位要求找到全部关键词证据；Redis、Kubernetes 没有原文证据。修改后的简历未加入这两项技能，雇主、日期、教育和项目未变化。
- 过期 revision 返回 `REVISION_CONFLICT`，损坏 PDF 返回 `INVALID_DOCUMENT`，非法邮箱返回字段校验失败。所有导出文件的长度和 SHA-256 均与 MCP 返回值一致。
- 本轮 Codex 输出的 PDF 和 Word 各渲染一页并查看，中文、行距、标题、页码正常，无裁切或重叠。Word 使用隔离 LibreOffice。
- 同时复查原生状态：Codex 已启用且发现 7 个工具，Claude Code MCP 健康检查显示 Connected。

本轮报告和导出文件：`artifacts/local-test/codex-0.2.1-s0l8FV/`、`artifacts/local-test/claude-0.2.1-pYJ1Yq/`，每份 `report.json` 含实际安装路径、工具调用结果、耗时和校验和。复现命令为 `npm run test:local`，测试其他已安装副本时使用 `--plugin-root`。此处的 SDK 完整流程不等于客户端模型自动选择工具或桌面 UI 的完整会话。

## 尚未验证

- Codex / Claude Code 中由模型驱动的“建简历 → 修改 → 导出”完整交互会话；原生 CLI 安装、工具发现/健康检查已验证，不冒充桌面 UI 验收。
- GitHub 上的远端 CI 尚未触发；本地 Windows 和 Linux 包运行已验证。
- 公网 HTTP 部署、远程目录审核、账号权限、包名可用性及 Registry 收录。
- Microsoft Word 桌面应用及其他字体组合的排版；当前 Word 视觉验收基于隔离 LibreOffice，不能保证所有编辑器的分页完全相同。
- 扫描件 OCR、复杂多栏顺序重建、多模板及持久经历库：0.2.1 未实现；多模板已在 0.3.0 实现，见当前记录。

历史产物与内容清单位于 `artifacts/0.2.1/local/`。0.2.0 与 0.2.1 包保留供历史对照；本文件顶部记录当前版本验收。
