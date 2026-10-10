# 超级简历 · 插件安装说明

这是包含完整运行程序的安装包，提供 117 套简历模板、17 个风格分类和 9 个 MCP 工具。支持 Codex、Claude Code，以及允许配置本地 stdio 服务器的 MCP 智能体。

## 从 GitHub 安装

安装 Node.js 22.12.0 或更新版本、Git 和相应客户端后，可直接使用以下命令。GitHub 仓库已包含完整运行程序，无需 npm 账号、安装依赖或自行构建。

Codex：

```text
codex plugin marketplace add xum74526-art/super-resume
codex plugin add super-resume@super-resume
```

Claude Code：

```text
claude plugin marketplace add xum74526-art/super-resume --scope user
claude plugin install super-resume@super-resume --scope user
```

完成后重新开启客户端会话，接着阅读下方“安装后怎么用”。GitHub 分发与 npm、MCP Registry、平台官方公共目录是不同的渠道，后面三项尚未发布。

## 使用 ZIP 安装包

1. 安装 Node.js 22.12.0 或更新版本，运行 `node --version` 确认终端能找到它。
2. 将 `super-resume-marketplace-<版本>.zip` 完整解压到一个长期保留的目录。不要仅在压缩包中预览，也不要只复制某个程序文件。
3. 在解压目录打开终端。应能看到下方结构，其中以 `.` 开头的目录可能被文件管理器隐藏。

```text
README.md
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
plugins/super-resume/
  plugin.json
  mcp.json
  .claude-plugin/plugin.json
  .mcp.json
  skills/super-resume/SKILL.md
  bin/super-resume.cjs
  bin/document-worker.mjs
  bin/assets/
```

包内已含运行依赖与中文字体，无需执行 `npm install` 或下载参考项目。下面按你使用的客户端选择一种安装方式。

## Codex

在解压目录使用支持 `plugin` 子命令的 Codex CLI：

```text
codex plugin marketplace add .
codex plugin add super-resume@super-resume
codex plugin list --marketplace super-resume --json
```

安装后重新开启 Codex 会话，让插件工具与技能被加载。若终端找不到 `codex`，请先配置 Codex CLI；也可以使用下方通用 MCP 配置，在支持本地 MCP 的客户端接入。

## Claude Code

在解压目录运行以下命令，安装到自己的用户配置，使其他项目也能使用：

```text
claude plugin marketplace add . --scope user
claude plugin install super-resume@super-resume --scope user
claude plugin list
claude mcp list
```

安装后重新开启 Claude Code 会话。只想在某个项目启用时，在该项目的终端中把 `.` 替换为解压目录的绝对路径，并把两条命令的 `--scope user` 改成 `--scope local`。

## 通用 MCP 智能体

使用 `command: "node"`，参数为本包中 `plugins/super-resume/bin/super-resume.cjs` 的绝对路径和 `--stdio`。示例中的中文路径必须替换；Windows JSON 路径可使用 `/`。

```json
{
  "mcpServers": {
    "super-resume": {
      "command": "node",
      "args": ["替换为解压目录的绝对路径/plugins/super-resume/bin/super-resume.cjs", "--stdio"]
    }
  }
}
```

按客户端要求保存配置并重新连接。部分客户端使用不同的顶层字段，例如 `servers`；以宿主设置为准。标准 MCP 提供工具能力，技能加载与二进制文件保存能力取决于宿主。

## 安装后怎么用

向智能体发送：

> 使用超级简历帮我做一份简历。先询问我缺少的信息，根据目标岗位推荐模板，然后生成预览，最后保存 PDF 和可编辑 Word。

也可以提供自己的 PDF/Word 简历，让智能体提取原文、调整表达、匹配岗位和更换模板。插件不会编造经历，扫描件目前需要另外做 OCR。

需要自己选择和编辑模板时，在解压目录运行：

```text
node plugins/super-resume/bin/super-resume.cjs --studio
```

打开终端打印的地址（默认 `http://127.0.0.1:3141/`）。工作台与 MCP 使用同一套模板和导出程序。界面以虚构示例开始，不自动读取智能体中的简历；用 JSON 文件在两者之间传递，离开前保存资料。

## 检查、更新和卸载

`node plugins/super-resume/bin/super-resume.cjs --version` 显示包版本；`node plugins/super-resume/bin/super-resume.cjs templates` 能列出模板。正常的 stdio 模式会静默等待客户端，不会自行打开网页。

更新时，把新包解压到原来的市场目录，再运行 `codex plugin add super-resume@super-resume` 或 `claude plugin update super-resume@super-resume --scope user`，然后重新开启会话。使用项目本地安装的 Claude Code 请改为 `--scope local`。更新不会自动读取或保存个人简历。

卸载命令为 `codex plugin remove super-resume@super-resume` 或 `claude plugin uninstall super-resume@super-resume --scope user`；通用 MCP 客户端删除对应的服务器配置即可。

## 分发状态

插件支持从 GitHub 仓库或解压后的 ZIP 安装。npm、MCP Registry 和平台官方公共目录尚未发布，这些渠道仍需项目所有者配置发布身份并完成相应流程。其他智能体必须安装或配置后才能使用，不会自动收到推送。

授权和第三方声明位于 `plugins/super-resume/LICENSE` 与 `plugins/super-resume/THIRD_PARTY_LICENSES.txt`。默认 stdio 在本机处理数据，MCP 工具不建立共享资料库；是否把简历发送给宿主模型由所用智能体的设置决定。
