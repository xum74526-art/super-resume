# 第三方来源

## 运行时

0.2.0 增加 `unpdf` / Mozilla PDF.js、`pdf-lib`、`fontkit`、`docx`、`yauzl`、`saxes`。版本固定在 package-lock.json。Noto Sans CJK SC Regular 字体未修改，按 OFL-1.1 随包携带，来源与 SHA-256 位于 `assets/fonts/source.json`。

Mozilla PDF.js 6.1.200 已预打包在 unpdf 内，其 Apache-2.0 文本单独保留。部分 npm 包仅在 README 声明许可，构建器对固定版本收集原始声明并补充完整许可文本。补充文本在 `assets/licenses/`。fontkit 的字形子集字节编码器由本项目适配为 pdf-lib 所需的流接口，没有修改上游包源码。

简历 schema 来自 [JSON Resume](https://github.com/jsonresume/jsonresume.org/tree/master/packages/schema)，MIT。协议 SDK 来自 [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)，以及 Ajv、ajv-formats、fast-json-patch、Zod 和它们实际被打包的依赖。

`npm run build` 根据 esbuild 的真实输入收集对应 npm 包的 LICENSE / NOTICE，不把仅用于开发或参考的项目混入发布归属声明。完整文本在生成的 `plugins/super-resume/THIRD_PARTY_LICENSES.txt` 和每个发布包内保留。

## 参考仓库

Reactive Resume、ResumeHQ、Resume Matcher、JSON Resume 的原始许可随 `references/upstream/` 中的独立仓库保留。版本与用途见 [参考索引](references/README.md)。参考仓库不会被打包；本版未复制其中三个应用项目的源码。

## 分发校验 schema

- `distribution/schemas/plugin.schema.json` 与 `mcp.schema.json` 来自 [Agent Plugins 1.0.0](https://agent-plugins.org/schemas/)，按下载时的公开规范保存，无修改。
- `distribution/schemas/server.schema.json` 来自 [MCP Registry 2025-12-11](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json)，无修改。

它们仅用于仓库内的构建校验，不包含在运行时包中。原始 schema ID 保留，用于追溯版本；项目自有代码的授权选择不改变上游许可。

## 0.5.0 模板设计

新模板为自有实现，研究来源见 `docs/templates.md`。旧版 192 个社区模板及 Bootstrap CSS 已从运行目录及插件包移除，其源码与许可证仅在本地退役资料中保留。无商用平台模板素材或源码进入本版分发。

## 0.6.0 国内风格与示例人物

新增 24 种页头、分栏、目录与色带组合，研究包含国内短视频公开介绍、可画、锤子和幻主的公开展示；来源与访问限制见 `docs/domestic-design-research.md`。两张示例人物照片为内置 ImageGen 生成的虚构人物，生成提示随 `assets/samples/README.md` 保存。没有打包商业平台照片或视频。
