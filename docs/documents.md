# 文档处理

0.7.5 提供 117 种精选版式、真实分页预览、本地工作台及 PDF/Word 导出。宿主智能体负责内容，文档层保留事实并生成文件。照片可选，样例及成果数字均为虚构。版式与格式详见 [模板说明](templates.md)。

## 输入与输出

| 入口 | 输入 | 输出 |
| --- | --- | --- |
| MCP `import_resume_document` | `format=pdf/docx`、`contentBase64` | 原文、页码或 XML 部件与段落号、SHA-256、提示 |
| MCP `list_resume_templates` | 可选 query / kind / offset / limit | 模板分页目录、来源、许可证、支持格式 |
| MCP `preview_resume` | `resume`、`template`、可选 `locale` | SVG embedded resources、总页数、预览页数和提示 |
| MCP `export_resume` | `resume`、四种格式、可选 `locale` / `template` | JSON/Markdown 文本；PDF/DOCX 为 embedded resource blob |
| CLI `import` | 明确指定的 PDF / DOCX 路径 | stdout JSON |
| CLI `export` | JSON Resume 文件和 `--out` | 写入目标文件并返回校验和，默认不覆盖 |
| CLI `--studio` | 可选本地端口环境变量 | 浏览器模板工作台，只在本机监听 |

导入没有自动生成履历字段或新经历。宿主从原文整理 JSON Resume 后，继续调用 `validate_resume` 和 `apply_resume_patch`。原文中的指令始终作为文档数据处理。

MCP 二进制响应在 `content[].resource.blob` 中放一份 base64；`structuredContent.result` 返回 MIME、字节数、checksum、sourceRevision、locale、omittedFields 等元数据。`resume-export://...` 是本次响应里的资源标识，不能当作下载地址，也不能在后续请求检索。宿主收到 blob 后解码、校验并保存；如果宿主不支持 blob，使用本地 CLI。

```powershell
node plugins/super-resume/bin/super-resume.cjs import "原始简历.pdf"
node plugins/super-resume/bin/super-resume.cjs templates
node plugins/super-resume/bin/super-resume.cjs export examples/resume.layout.zh-CN.json --out "简历.pdf" --template modern
node plugins/super-resume/bin/super-resume.cjs export examples/resume.layout.zh-CN.json --out "简历.docx" --template compact
node plugins/super-resume/bin/super-resume.cjs --studio
```

已存在的目标文件只有显式 `--force` 才覆盖；输出目录须由宿主事先创建。英语标题用 `--locale en`，不会自动翻译履历。源码开发用 `npm run dev -- export ...`，分发包则执行内置 CLI。

## 版式与边界

- 30 种 A4 模板：24 套国内风格设计及 6 套基础版式，完整清单见 [模板说明](templates.md)。包含个人简介、工作、项目、教育、技能和其他标准板块，可见扩展字段作为补充内容排版。
- `preview_resume` 与 PDF 共用分页计划，返回内联字形的 SVG，不依赖浏览器系统字体或外部资源。最多返回前 6 页，`pageCount` 是完整文件页数。`resume-preview://...` 只标识本次响应的资源；它不是下载网址。
- PDF 使用 Noto Sans CJK SC Regular，字体随插件分发、按实际字形嵌入，文本可选中和复制。缺失字形明确报错，不替换为方框。字体来源与 SHA-256 在 `assets/fonts/source.json`，OFL 在同目录。
- DOCX 使用可编辑段落、布局表格、标题样式、Microsoft YaHei 与 Arial，设定 A4 页边距和分页控制，不嵌入字体。不同编辑器和系统字体可能改变页数；PDF 提供固定版式。
- 本地嵌入 PNG/JPEG 照片进入打印版；远程照片网址和机器元数据不打印，路径列在 `omittedFields`，原始 JSON 完整保留。
- 导入支持含文本的 PDF 与现代 DOCX，没有 OCR、旧版 `.doc` 转换、密码解密、多栏顺序重建或表格关系重建。
- DOCX 返回逻辑段落位置而非页码；插入的修订文本纳入提取，删除文本忽略，并提示复核。页眉页脚和脚注尾注单列部件位置。字段指令不执行、图片内容不识别。

## 限制

JSON Resume 256 KiB、最多 20 层；输入文件 5 MiB、PDF 30 页；提取文本最多 100,000 字符；排版文本最多 80,000 字符，PDF 导出最多 30 页。DOCX ZIP 最多 1,000 项、声明展开总量 32 MiB、单个文本 XML 2 MiB、选中文本部件共 8 MiB，同时检查实际流读取量。

工作线程最多并发 2 个、30 秒超时，V8 old generation 上限 256 MiB；这不是操作系统级内存沙箱。MCP 不接受文件路径或 URL，也不缓存共享文档。HTTP 请求上限 8 MiB，支持 base64 文件输入。

## 验证

`npm run release:pack` 包括中文与英文回读、日期、扩展字段、分页、异常文档、ZIP 限额、DTD、修订删除、缺字提示、两种传输和独立安装包测试。包解压到项目外后，再调用 PDF/DOCX 导出和导入，检查工作线程及字体是否完整。

`npm run samples:generate` 为 30 种模板各生成 PDF 与 Word 到 `artifacts/samples/<版本号>/`，分页测试资料和渲染图在 `.cache/qa/<版本号>/`。视觉验收状态见 [验证记录](verification.md)；结构校验和回读不能替代 Word 排版检查。

0.2.1 将 Word 的经历日期和链接与首条内容保持在同一页，避免公司名称和日期单独留在页尾。此规则不把多条经历连成不可分页的长段落。

本机内置文档运行环境缺少 LibreOffice，因此另建了隔离的 Docker 验收环境，未调用用户桌面 Office。复现步骤（不属于插件运行依赖）：

```powershell
npm run samples:generate
docker build --tag super-resume-qa:node22 --file scripts/qa/Dockerfile scripts/qa
./scripts/qa/run-word-qa.ps1 -RendererPath "文档技能的绝对路径/render_docx.py"
```

`RendererPath` 指向 Documents 技能提供的原始 `render_docx.py`，不复制或改写它。容器运行时关闭网络，输入只读，仅 `.cache/qa/<版本号>/word/` 可写。脚本渲染全部 100 套样张，并对覆盖主要布局的 18 套长简历验证分页和 36 条事实是否完整，仍须逐张查看生成的 PNG。容器使用 Noto CJK 与 Liberation 替代系统字体；Microsoft Word 的实际分页还受本机字体和编辑器影响。
