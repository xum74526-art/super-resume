# 超级简历插件

让智能体制作、修改和导出个人简历。内含 117 套模板、17 个风格筛选分类、PDF / 可编辑 Word / HTML / JSON / Markdown 导出，以及可选的本地可视化工作台。

需要 Node.js 22.12.0 或更新版本。运行依赖、中文字体和许可证已随包提供，无需在插件目录执行 `npm install`，也无需额外的模型 API 密钥。

## 在智能体中使用

Codex 与 Claude Code 建议使用 `super-resume-marketplace-<版本>.zip` 安装包，按照其中的中文 README 添加本地市场并启用插件。本目录也可直接作为 Claude Code 的 `--plugin-dir` 参数；路径包含空格时使用引号。

安装并重新开启会话后，可以直接说：

> 使用超级简历帮我制作简历。先根据我的岗位推荐几套模板，再根据我提供的经历制作预览，最后保存 PDF 和可编辑 Word。

插件提供 9 个 MCP 工具：结构查询、创建、校验、修改、岗位关键词匹配、PDF/Word 原文提取、模板检索、预览和导出。工具负责校验与文档处理，内容润色由调用它的智能体完成。

## 其他 MCP 客户端

在客户端的 MCP 配置中添加下列服务器，将参数中的示例替换为本目录下 `bin/super-resume.cjs` 的完整绝对路径。Windows JSON 路径可使用 `/`；不同客户端的顶层配置字段可能不同。

```json
{
  "mcpServers": {
    "super-resume": {
      "command": "node",
      "args": ["替换为插件的绝对路径/bin/super-resume.cjs", "--stdio"]
    }
  }
}
```

通用 MCP 接入提供同样的工具能力；是否加载 `skills/super-resume/SKILL.md` 取决于客户端。不要只复制主程序，`bin/document-worker.mjs`、`bin/assets/` 也必须保留。

## 打开模板工作台

在本插件目录执行：

```text
node bin/super-resume.cjs --studio
```

浏览器打开程序打印的地址，默认是 `http://127.0.0.1:3141/`。可以选择模板、编辑、导入/保存 JSON 资料，以及下载 PDF 和 Word。界面初始内容是虚构示例，关闭前请保存资料。终端按 Ctrl+C 关闭工作台；智能体的 MCP 连接无需先打开工作台。

## 数据与发布状态

默认在本机处理，不建立共享简历库，不提交求职申请，不调用额外的云端评分服务。请只使用本人提供的真实经历；照片为可选项。导出的二进制文件由宿主保存，PDF 与 Word 的分页可能有差异。

可安装不等于已上架。这个本地包不表示已经发布到公开插件市场或 MCP Registry。自有代码的授权以随包 `LICENSE` 为准；第三方声明见 `THIRD_PARTY_LICENSES.txt`。
