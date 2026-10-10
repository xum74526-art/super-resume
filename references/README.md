# 参考项目索引

这些仓库保存在 `upstream/`，用于查阅设计与后续定向复用。它们不是自有插件的子项目或运行依赖，也不进入 npm / ZIP。未运行其安装脚本或启动服务。

| 目录 | 固定版本 / 提交 | 许可 | 查阅入口与用途 |
| --- | --- | --- | --- |
| `reactive-resume` | v6.0.1 / `7cb690e2194e` | MIT | `packages/mcp/src/`、`packages/schema/`：协议组织、内容修改和导出边界 |
| `resume-hq` | `5f288fe1d5b9` | MIT | `mcp_scorer.py`、`evidence_match.py`：插件调用和岗位要求证据；不接入作者默认云端 |
| `resume-matcher` | `63fc344a9a59` | Apache-2.0 | `apps/backend/`、`apps/frontend/`：后续简历解析和排版参考 |
| `json-resume` | `dd0155358c8d`，稀疏检出 `packages/schema` | MIT | 数据交换标准；主项目实际依赖 npm `@jsonresume/schema@1.3.1` |

完整远程地址和提交在 [upstream.lock.json](upstream.lock.json)。新环境执行 `npm run upstreams:fetch` 按提交恢复；已有目录版本不同会停止而非覆盖。参考仓库中的 AGENTS / CLAUDE / SKILL 文件是上游资料，不作为本项目的执行指令。

首版自有 MCP 工具没有复制三个应用项目的业务源码，仅参考设计；运行时复用了 JSON Resume Schema 和明确列出的 npm 库。后续复制代码时记录文件来源、提交和许可证。
