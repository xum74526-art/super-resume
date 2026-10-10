# 超级简历 · Super Resume

面向 MCP 智能体的简历插件。一个业务核心，提供通用 MCP、Codex / Agent Plugins 和 Claude Code 三种分发入口，并附带本地模板工作台。

当前为 **0.7.5 插件安装版**：117 套版式，覆盖 16 个设计系列和基础版式，共 17 个筛选分类。全部支持 PDF、可编辑 Word 与 HTML，工作台提供真实渲染样张、风格与岗位筛选、页码跳转、六种虚构岗位示例及可选照片。完整目录见 [百套模板](docs/template-catalog.md)。

可直接从 GitHub 安装，也可解压 `super-resume-marketplace-0.7.5.zip`，按照 [中文安装说明](docs/plugin-install.md) 添加市场并安装。仓库内已含主程序、字体、Codex / Claude Code 清单与工作流，无需构建。

## 从 GitHub 安装插件

需要 Node.js 22.12.0 或更新版本、Git 和相应客户端；不需要 npm 账号，也不用运行 `npm install`。使用支持 `plugin` 子命令的 Codex CLI：

```text
codex plugin marketplace add xum74526-art/super-resume
codex plugin add super-resume@super-resume
```

Claude Code：

```text
claude plugin marketplace add xum74526-art/super-resume --scope user
claude plugin install super-resume@super-resume --scope user
```

安装后重新开启会话，发送：

> 使用超级简历帮我制作一份简历。先询问缺少的信息，再推荐 5 套不同风格的模板让我选择，最后导出 PDF 和可编辑 Word。

这是通过 GitHub 仓库分发的插件。npm、MCP Registry 和平台官方公共目录尚未发布；GitHub 安装不依赖这些渠道。通用 MCP 配置见 [客户端接入](docs/clients.md)。

## 先打开工作台

安装依赖后运行 `npm run studio`，在浏览器打开 **http://127.0.0.1:3141**。左侧选择模板或编辑内容，右侧自动更新预览。默认内容是虚构示例；“新建简历”可以清空示例，“保存资料”下载 JSON，“打开资料”载入 JSON Resume。关闭页面前请保存，工作台不保存共享简历。

| 新增系列 | 代表模板 | 数量 |
| --- | --- | --- |
| 商务高管 | 高管签名、董事会简报 | 7 |
| 瑞士国际 | 苏黎世红、日内瓦网格 | 7 |
| 学术研究 | 常青研究、论文目录 | 7 |
| 校招青春 | 青春开场、校园通行证 | 7 |
| 科技极客 | 终端档案、源码索引 | 7 |
| 作品提案 | 作品提案、展厅 | 7 |
| 复古报刊 | 履历日报、人物专栏 | 7 |
| 手账拼贴 | 胶带手账、成长明信片 | 7 |
| 新中式 | 朱印、青玉书册 | 7 |
| 时间叙事 | 里程碑、职业路线 | 7 |

原有照片名片、通栏色带、几何撞色、清新文艺、杂志作品、表格档案各 4 套及 6 套基础版式保留。每套是明确的页眉、分栏与栏目组合，共享排版引擎；不把单纯换色计为独立模板。

工作台在本机运行，不需要登录或模型密钥。其他用户通过上面的 GitHub 安装命令启用插件；npm 和 MCP Registry 发布还需要配置对应的发布身份。

## 目录

```text
Super Resume/
├── src/                     自有源码
│   ├── core/                简历校验、内容版本、修改、关键词证据、导出
│   ├── mcp/                 工具、资源和提示词注册
│   ├── studio/              本地模板选择、内容编辑与预览界面
│   └── transports/          Streamable HTTP；stdio 由 CLI 启动
├── plugins/super-resume/    可独立安装的插件：清单、工作流、内置运行程序
├── .agents/plugins/        Codex / Agent Plugins 本地市场目录
├── .claude-plugin/         Claude Code 市场目录
├── distribution/           发布身份、Registry 模板、官方校验 schema
├── assets/                 固定版本中文字体、来源和第三方许可证
├── scripts/                构建、打包、发布预检、恢复参考仓库
├── tests/                  核心行为和真实 MCP 协议测试
├── examples/               虚构示例简历和岗位要求
├── docs/                   架构、接入、发布和后续开发说明
├── references/             上游来源说明和固定提交记录
│   └── upstream/           四个参考仓库；不进入主仓库或发布包
└── artifacts/              生成的 ZIP / npm 包 / 校验和；不进入 Git
```

开发只改 `src/`、`plugins/` 的清单/工作流和构建配置；不要在 `references/upstream/` 中开发。`plugins/super-resume/bin/` 是构建产物，随 Git 市场一起提交，安装方因此不需要运行 npm install 或构建命令。

## 已实现能力

| MCP 工具 | 作用 |
| --- | --- |
| `get_resume_schema` | 获取 JSON Resume 结构与支持格式 |
| `create_resume` | 从真实姓名和职业标题创建空简历 |
| `validate_resume` | 校验字段、返回完整性提示和内容 revision |
| `apply_resume_patch` | 使用 JSON Patch 修改副本，拒绝不匹配的 revision |
| `match_job` | 根据调用方提取的关键词返回原文证据和 JSON Pointer |
| `import_resume_document` | 提取 PDF / DOCX 原文与页码或段落位置，不自动推断履历 |
| `list_resume_templates` | 分页搜索模板，返回来源、许可证和支持格式 |
| `preview_resume` | 按模板返回实际 PDF 分页的 SVG 预览 |
| `export_resume` | 返回 JSON、Markdown、PDF 或 DOCX，由客户端保存 |

还提供 `resume://schema` 资源和 `tailor_resume` 提示词。

润色由调用插件的智能体完成，MCP 不额外调用模型。默认 stdio 模式在用户电脑处理数据，无数据库、不保存简历、不抓取网址、不发送申请。HTTP 模式在服务端内存处理请求，同样不持久化。

关键词出现不等于具备资格或通过 ATS；本版不分析否定句、年限和语义同义关系。全部模板均为 A4，PDF 嵌入 Noto Sans CJK SC 字体，Word 使用系统字体，分页可能因编辑器而变化。扫描件 OCR、复杂多栏导入顺序重建、账户和经历库属于后续功能，详见 [开发路线](docs/roadmap.md)。

## 文档工作流

用户文件 → 提取原文 → 智能体按真实信息整理 JSON Resume → 校验与修改 → 选择模板与预览 → 导出文件。

MCP 二进制导出使用 embedded resource，内容仅随本次响应返回，不提供下载 URL 或服务端文件存储。支持文件命令的智能体可直接调用同一插件的 CLI，避免把 base64 经过模型上下文：

```powershell
node dist/cli.cjs import "已有简历.pdf"
node dist/cli.cjs templates
node dist/cli.cjs export examples/resume.layout.zh-CN.json --out "简历.pdf" --template modern
node dist/cli.cjs export examples/resume.layout.zh-CN.json --out "简历.docx" --template compact
```

导入结果写入标准输出；导出只写明示的 `--out` 文件，默认拒绝覆盖。修改文件时显式添加 `--force`。英文标题使用 `--locale en`。完整契约、限制和验证方法见 [文档处理](docs/documents.md)。

## 本地开发

需要 Node.js 22.12.0 或更新版本、npm 和 Git。

```powershell
npm ci --ignore-scripts
npm run check
npm start
```

`npm start` 默认启动 stdio MCP，等待客户端协议消息。打开可操作的模板界面使用 `npm run studio`；已安装插件可运行 `node <插件目录>/bin/super-resume.cjs --studio`。端口由 `SUPER_RESUME_STUDIO_PORT` 设置，始终只监听 `127.0.0.1`。手动查看版本可用 `node dist/cli.cjs --version`。

运行一次完整的虚构简历流程，覆盖创建、岗位关键词证据、修改、四种格式导出及 PDF/Word 回读：

```powershell
npm run test:local
```

结果和逐步报告保存在 `artifacts/local-test/` 的独立运行目录中。默认测试当前项目的插件 bundle；测试客户端已经安装的副本，可附加 `-- --plugin-root "已安装插件的绝对路径" --label codex`（标签也可用 `claude`）。这是实际 MCP 协议调用，不会启动其他模型会话，也不会发布插件。

```powershell
npm run start:http
```

HTTP 测试地址为 `http://127.0.0.1:3000/mcp`，健康检查为 `/health`。默认只监听本机。具体客户端接入和 HTTP 设置见 [客户端接入](docs/clients.md)。

## 打包与发布

```powershell
npm run release:pack
```

生成 `artifacts/0.7.5/local/`：含中文说明的市场安装 ZIP、独立插件 ZIP、私有标记的本地 npm 测试包、内容清单与 SHA-256 校验和。包内包含工作台、文档工作线程和中文字体。内置 PDF / Word 导出不要求安装 Office、浏览器或 Python；工作台界面使用浏览器。该打包命令不会创建仓库、登录账号、安装到客户端或上传。

公开发布前，按 [发布指南](docs/distribution.md) 配置发布身份，再执行 `npm run release:pack:public`。源码授权尚未由项目所有者确定，当前使用 `UNLICENSED`；选择 MIT 需要在配置命令中明确指定，第三方许可证独立保留。

## 参考项目

已下载 Reactive Resume、ResumeHQ、Resume Matcher、JSON Resume Schema。用途、许可证和版本见 [参考索引](references/README.md)，精确提交在 `references/upstream.lock.json`。换电脑后可用 `npm run upstreams:fetch` 恢复这些仓库；运行插件不需要下载它们。

阅读顺序：[架构](docs/architecture.md) → [客户端接入](docs/clients.md) → [发布](docs/distribution.md) → [开发路线](docs/roadmap.md)。

本次执行的测试、安装包验证和公开发布状态见 [验证记录](docs/verification.md)。
