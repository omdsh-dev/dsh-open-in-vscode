# dsh-open-in-vscode

在 DeepSeek Harness Web 界面中直接打开工作区目录：侧边栏每个真实
Workspace 行的 **…** 菜单里新增三行 —— **在 VSCode 中打开**、
**在资源管理器中打开** 和 **在 PowerShell 中打开**。

## 功能

- 客户端优先使用 harness 的 `sidebar.workspaces.row-menu` 插槽；公开发布的
  DSH `0.1.0-rc.6` 尚未包含该插槽时，则自动启用受限兼容适配器。两条路径都渲染
  随语言切换的菜单行 —— 中文为 **在 VSCode 中打开** / **在资源管理器中打开** /
  **在 PowerShell 中打开**，英文为 **Open in VSCode** / **Open in Explorer** /
  **Open in PowerShell**。
- 点击任意一行会关闭菜单，并通过严格的 Typert Remote
  `openInVscode/open`、`openInVscode/openInExplorer`、
  `openInVscode/openInPowerShell` 把工作区目录交给主机。
- 主机侧分别用配置的编辑器 CLI（默认 `code <path>`）、`explorer <path>` 和
  `pwsh -NoExit`（以工作区为起始目录）打开该目录，进程分离，
  打开的窗口比服务器活得更久。在 Windows 上，三个动作都经 `cmd /c start`
  （ShellExecute）启动，让新窗口直接出现在屏幕最前方——后台服务直接 spawn
  GUI 程序只会让窗口在任务栏闪烁，控制台程序则会被
  CREATE_NO_WINDOW/DETACHED_PROCESS 隐藏或无法弹窗。

## 前置条件

- 已安装 VS Code，或 PATH 中存在编辑器 CLI。Windows 使用默认 `code` 时还会
  自动查找 VS Code 的标准用户级、系统级安装目录；macOS 请安装
  [VS Code 命令行工具](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line)，
  或在插件 `command` 中配置任何能打开目录的编辑器）。
- DSH `0.1.0-rc.6` 或更高版本。存在 Workspace 行菜单扩展点时使用原生插槽，
  `rc.6` 则使用兼容适配器。

## 安装

把插件加入你的 web profile（会在 profile 内执行 pnpm 并合并 bundle 层）：

```sh
dsh plugin --profile web add https://github.com/omdsh-dev/dsh-open-in-vscode/archive/refs/tags/v0.1.6.tar.gz
```

重启 Web 服务器（`kill -TERM <pid>` 并等待退出——切勿 `kill -9`，会撕裂
会话 zstd 日志），然后刷新页面。主机插件挂载在 `dsh-open-in-vscode`；
客户端 bundle 由 `/plugins/dsh-open-in-vscode/client.js` 提供。

版本化 tarball 会直接替换旧的固定提交，且不会运行 git `prepare` 脚本。可用以下
命令确认实际安装版本：

```sh
dsh plugin --profile web list dsh-open-in-vscode --depth 0
```

## 配置

部署相关的选项都是经校验的 `Config` 字段，可在 cordis.yml 中修改：

| 键 | 默认值 | 含义 |
| --- | --- | --- |
| `command` | `code` | 打开目录的可执行文件。默认值还会查找 Windows 的标准 VS Code 安装目录；其他命令按 PATH 解析。 |
| `args` | `[]` | 目录路径前附加的参数。 |

可执行文件缺失时会响亮失败并给出修复提示；相对路径会被拒绝。

**在资源管理器中打开**固定调用 `explorer`，**在 PowerShell 中打开**固定调用
`pwsh -NoExit` 并把工作区目录作为起始目录；两者均为 Windows 用途，按 PATH
解析，不在 `Config` 中暴露。

## 能力边界

| 动作 | 在哪里执行 | 是否需要审批 |
| --- | --- | --- |
| 在编辑器中打开工作区目录 | 主机（用户手势） | 否——用户主动点击了该行 |
| 在资源管理器中打开工作区目录 | 主机（用户手势） | 否——用户主动点击了该行 |
| 在 PowerShell 中打开工作区目录 | 主机（用户手势） | 否——用户主动点击了该行 |
| 其他 | — | 插件没有工具、没有设置命名空间、没有任何模型可见面 |

本插件不提供工具、技能或设置项，只打开用户在 DSH 中已经打开过的目录；
它自己从不读写文件。

## 开发

```sh
pnpm install
pnpm run check   # typecheck + lint + test + build；提交 lib/（file: 安装无需构建即可运行）
```

结构：线协议契约集中在 `src/contract.ts` 一个模块，主机 manifest
（`src/typert.ts`）与客户端贡献（`src/client/remote.ts`）共用同一份；
插槽声明与 Menu 节点行类型由 harness 提供。

## License

MIT
