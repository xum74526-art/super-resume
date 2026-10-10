# 发布指南

## 已准备的分发面

1. 自包含 Node.js MCP bundle，支持 npm / npx / stdio。
2. Agent Plugins 1.0.0 清单和 Codex marketplace。
3. Claude Code 插件清单与 marketplace。
4. MCP Registry 2025-12-11 `server.json` 模板、官方 schema 校验和发布身份一致性检查。
5. 市场安装 ZIP、独立插件 ZIP、npm tarball、文件清单、SHA-256 校验和，以及 Windows / Linux 的 CI 配置。

根 `package.json` 永远为 `private: true`，防止在源码目录误发布。公开 npm 包只从 `artifacts/<版本>/public/npm/` 生成。参考仓库、真实简历、源码测试目录和开发依赖不会进入发布包。

## 1. 本地包

```powershell
npm ci --ignore-scripts
npm run release:pack
```

输出位于 `artifacts/0.7.5/local/`。这是本地验收包，npm 清单带 `private: true`，不执行上传或发布。

- `super-resume-marketplace-0.7.5.zip`：推荐给安装者，包含 Codex / Claude Code 市场清单、完整插件和中文安装说明。解压后可按 README 添加本地市场，无需项目源码。
- `super-resume-plugin-0.7.5.zip`：单个插件，`plugin.json` 位于根部，适合直接 MCP 接入或 Claude Code `--plugin-dir`。
- `super-resume-mcp-local-0.7.5.tgz`：本地 npm 包，含完整运行程序，清单标记为私有。

三种包都包含主程序、文档工作线程和字体，不需要在插件目录安装依赖。打包验收会在项目外解压三种包，检查文件清单与 SHA-256，并实际执行 MCP 握手、预览、导出和回读。详见 [安装说明](plugin-install.md)。

## 先发布到 GitHub（无需 npm 账号）

GitHub 仓库分发可以独立于 npm 和 MCP Registry 完成。当前 Git 仓库地址为 `https://github.com/xum74526-art/super-resume`。仓库包含两份 marketplace 清单、插件工作流和 `plugins/super-resume/bin/` 下的自包含运行程序，安装命令见 [插件安装说明](plugin-install.md)。

首次上传前运行 `npm run release:pack`，确认 `.gitignore` 排除真实简历、缓存、依赖、生成文件和外部参考仓库。提交内置 bundle、字体、装饰资源及第三方许可证；主 `package.json` 保持私有，自有代码许可证保持项目所有者当前选择的 `UNLICENSED`。

GitHub 分发阶段不要求运行 `release:configure`，不要为通过校验编造 npm scope。待 npm 账号准备好后，再执行下方的发布身份配置及 Registry 登记。GitHub 仓库可安装不代表已通过任何平台官方目录审核。

## 2. 配置公开身份

这些值来自发布者自己的账号，不需要向开发者提供密码或令牌：

| 信息 | 获取方法 | 示例（不要直接使用） |
| --- | --- | --- |
| GitHub 仓库 | 登录后在 [GitHub 新建仓库](https://github.com/new)，名称可用 `super-resume`，公开分发选 Public。本地已有代码，创建时不要额外初始化 README、gitignore 和许可证。 | `用户名/super-resume` |
| npm 包名 | [注册 npm 账号](https://www.npmjs.com/signup)并验证邮箱。个人 scope 与用户名一致，首次发布时创建包。 | `@用户名/super-resume-mcp` |
| 发布者名称 | 自己选择对外显示的名字、昵称或团队名称。 | `你的团队名称` |
| 自有代码许可证 | 愿意开放使用、修改和商业复用，可选择 MIT，保留版权和许可声明；暂不授权则保持 UNLICENSED。 | `MIT` 或 `UNLICENSED` |

操作依据：[GitHub 创建仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)、[npm 账号](https://docs.npmjs.com/creating-a-new-npm-user-account/)、[npm scopes](https://docs.npmjs.com/about-scopes/)、[MIT 许可条款](https://choosealicense.com/licenses/mit/)。注册和登录由账号所有者在官方页面完成。

需要项目所有者提供自己的 GitHub 仓库和 npm scope，并决定自有代码授权。示例值不能直接发布：

```powershell
npm run release:configure -- --github OWNER/REPO --npm @SCOPE/super-resume-mcp --author "发布者名称" --license UNLICENSED
```

若所有者决定按 MIT 开源，明确将 `--license` 改为 `MIT`。该命令会更新自有源码的 LICENSE、写入 `distribution/publisher.json` 和 `distribution/server.json`，并更新市场发布者信息；不会创建账号、GitHub 仓库或上传代码。

构建时自动同步插件版本、发布者信息及 Registry 描述。Registry `name` 使用 `io.github.<GitHub所有者>/super-resume`；生成的 npm 包 `mcpName` 必须与之完全一致。

```powershell
npm run release:pack:public
```

没有配置真实身份时，该命令会明确失败，不能把占位数据当成可上架包。`release:check` 只检查本地清单和协议，不证明账号权限、npm 名称可用性、远端仓库状态或平台审核通过。

## 3. 发布 Git 与 npm

先把自有项目推送到配置的 GitHub 仓库，包含内置 bundle、两份 marketplace 清单和许可证。`references/upstream/` 已被 Git 忽略，来源可以通过 lock 恢复。

检查 npm 发布账号具有对应 scope 的权限，并完成 npm 登录/2FA 后：

```powershell
npm publish ./artifacts/0.7.5/public/npm --access public
```

需要主动运行发布命令才会上传；构建和测试不会发布。发布后在干净目录用实际包名和固定版本运行 `npx`，测试 MCP 握手和示例调用。

## 4. 登记 MCP Registry

按官方说明安装 `mcp-publisher`，从含有生成 `server.json` 的目录执行：

```powershell
cd artifacts/0.7.5/public
mcp-publisher login github
mcp-publisher publish
```

发布者身份必须拥有 Registry 命名空间；先完成 npm 发布，再登记对应版本。Registry 托管元数据，运行包仍在 npm。目录消费方可能采用自己的同步、筛选和审核政策，因此无法承诺所有智能体都会自动收到或安装。

Codex / Claude Code 可以通过公开 Git marketplace 安装同一插件。公开通用插件目录或 ChatGPT 远程插件审核属于另一个分发流程，不由 MCP Registry 代替。

## 升级

修改根 `package.json` 的版本并同步 package-lock；重新构建、测试、配置检查和打包。npm 版本与 Registry 版本保持一致，不覆盖已发布版本。插件清单通过构建同步，工作流更改也应提升版本。

## 官方依据

- [MCP Registry 发布流程](https://modelcontextprotocol.io/registry/quickstart)
- [MCP Registry 包验证](https://modelcontextprotocol.io/registry/package-types)
- [OpenAI 插件打包与本地市场](https://developers.openai.com/plugins/build/plugins)
- [OpenAI 公开目录提交流程](https://developers.openai.com/plugins/deploy/submission)
- [Claude Code 插件清单](https://code.claude.com/docs/en/plugins-reference)
- [Agent Plugins MCP 格式](https://agent-plugins.org/plugin-authors/mcp-servers)

规范核对日期：2026-10-09。官方 JSON Schemas 保存在 `distribution/schemas/` 供离线构建校验；它们不是运行时联网依赖。
