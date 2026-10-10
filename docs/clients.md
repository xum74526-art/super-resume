# 客户端接入

从安装包开始使用，请优先阅读 [插件安装说明](plugin-install.md)。`super-resume-marketplace-0.7.5.zip` 自带市场目录、插件运行程序和工作流，可独立于源码仓库安装。下文面向本项目的开发与验证。

## 当前目录的通用 MCP

先 `npm run build`。客户端使用 Node.js 22.12.0 或更新版本，工作目录不影响 bundle 启动。

配置示例（将中文占位内容替换为安装目录的绝对路径）：

```json
{
  "mcpServers": {
    "super-resume": {
      "command": "node",
      "args": ["替换为安装目录的绝对路径/plugins/super-resume/bin/super-resume.cjs", "--stdio"]
    }
  }
}
```

Windows JSON 路径可使用 `/`。VS Code 使用 `servers` 顶层而非 `mcpServers`，具体字段以宿主文档为准。

## Codex 插件

在仓库根目录构建后，可以将本仓库作为本地 marketplace：

```powershell
codex plugin marketplace add .
codex plugin add super-resume@super-resume
codex plugin list --marketplace super-resume --json
```

上述原生 CLI 命令会注册本地市场并安装、启用插件；也可以在支持本地 marketplace 的桌面界面中安装。仓库已有 `.agents/plugins/marketplace.json`。安装后开启新的客户端会话加载插件；现有会话是否需要刷新或重启取决于客户端版本。

从 GitHub 安装时，将上面的 `.` 换成 `xum74526-art/super-resume`。Git 提交必须包含整个 `plugins/super-resume/bin/`（主程序、工作线程、字体）、工作流和许可证，安装方无需运行构建脚本，也无需 npm 账号。

直接 MCP 接入也可以：

```powershell
codex mcp add super-resume -- node "替换为安装目录的绝对路径/plugins/super-resume/bin/super-resume.cjs"
```

## Claude Code 插件

本地试用，无需先上架：

```powershell
claude --plugin-dir "替换为安装目录的绝对路径/plugins/super-resume"
```

也可通过原生 CLI 在当前项目本地安装：

```powershell
claude plugin marketplace add . --scope local
claude plugin install super-resume@super-resume --scope local
claude mcp list
```

`local` 设置保存在当前项目的 `.claude/settings.local.json`，该文件已加入 Git 忽略规则。也可以在 Claude Code 交互会话中添加市场：

```text
/plugin marketplace add "替换为安装目录的绝对路径"
/plugin install super-resume@super-resume
```

从 GitHub 安装时使用 `/plugin marketplace add xum74526-art/super-resume`，再执行安装命令。适配文件使用 `${CLAUDE_PLUGIN_ROOT}`，通用清单使用 `${PLUGIN_ROOT}`，不依赖开发机目录。

## npm / Registry 发布后的接入

发布完成后，其他 MCP 客户端可以配置 `command: "npx"` 和 `args: ["-y", "@你的scope/super-resume-mcp@0.7.5"]`。此处包名是说明示例，不能在实际发布前使用。Registry 不会推送或强制安装插件；客户端从目录发现后仍需用户启用。

## HTTP

```powershell
npm run start:http
```

使用支持 Streamable HTTP 的 MCP 客户端连接 `http://127.0.0.1:3000/mcp`。仅有 POST，无独立 SSE 连接、会话存储和账户。

环境变量：

| 名称 | 默认 | 用途 |
| --- | --- | --- |
| `SUPER_RESUME_HOST` | `127.0.0.1` | 监听地址 |
| `SUPER_RESUME_PORT` | `3000` | 端口 |
| `SUPER_RESUME_ALLOWED_HOSTS` | localhost 与回环地址 | 可接受的 Host 主机名，逗号分隔，不带端口 |
| `SUPER_RESUME_ALLOWED_ORIGINS` | 空 | 接受的浏览器 Origin 完整值，逗号分隔 |

外部监听必须显式设置 Host 白名单。部署时使用 HTTPS 反向代理、请求限流和适当超时；不要启用记录请求正文的日志。若代理改变 Host，白名单按实际传入应用的主机名配置。当前未提供面向账户的 OAuth，不应直接追加跨用户的持久化数据工具。

## 验证范围

自动测试通过官方 MCP SDK 客户端测试 stdio、HTTP、发现能力和工具调用；分发校验启动的是真正打包后的程序。它们不等同于每一种商业客户端的 UI 验收。发布前在目标客户端手动完成一次“建简历 → 修改 → 导出”的真实操作。
