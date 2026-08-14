# dsh-open-in-vscode

从 DeepSeek Harness Web 界面用本机编辑器打开已经登记的 Workspace。Workspace 的 **…** 菜单可以直接启动首选编辑器；检测到多个启动目标时，还会提供编辑器选择菜单。

[English](README.md) | 中文

## 功能

- Host 会检测已安装的 VS Code、Cursor、Windsurf、Zed、常见 JetBrains IDE、系统终端和文件管理器；管理员配置的编辑器会加入该列表。
- 主菜单行使用 Host 配置或当前浏览器记住的编辑器打开 Workspace。点击右侧箭头可以选择其他编辑器；选中的编辑器会启动并成为当前浏览器的首选项。
- 配置过但找不到的编辑器会保留为禁用菜单项，并显示修复提示；未安装的自动检测候选不会占用菜单。
- 客户端在 Host 声明 `sidebar.workspaces.row-menu` 时使用原生插槽；公开发布的 DSH `0.1.0-rc.6` Web UI 没有该插槽时，使用受限兼容适配器。
- 编辑器进程启动后与 DSH Web 服务器分离，可以独立存活。

## 自动检测目标

| 平台 | 自动检测的目标 |
| --- | --- |
| macOS | VS Code、Cursor、Windsurf、Zed、IntelliJ IDEA、WebStorm、PyCharm、终端、Finder |
| Windows | VS Code、Cursor、Windsurf、Zed、IntelliJ IDEA、WebStorm、PyCharm、Windows Terminal、文件资源管理器 |
| Linux | VS Code、Cursor、Windsurf、Zed、IntelliJ IDEA、WebStorm、PyCharm、`x-terminal-emulator`、`xdg-open` |

所有平台都会查询 PATH；macOS 和 Windows 还会检查各内置配置中列出的标准应用目录。Host 插件加载时完成检测；安装新编辑器或修改配置后需要重启 DSH。

## 前置条件

- 至少存在一个可用的内置编辑器或已配置的编辑器可执行文件。
- DSH `0.1.0-rc.6` 或更高版本。较新的运行时可以提供原生 Workspace 行菜单插槽；`rc.6` 使用兼容适配器。

## 安装

把插件加入 Web profile：

```sh
dsh plugin --profile web add https://github.com/omdsh-dev/dsh-open-in-vscode/archive/refs/tags/v0.2.0.tar.gz
```

使用 `SIGTERM` 重启 Web 服务器，等待它退出后刷新页面。切勿使用 `kill -9`，否则可能中断 Session zstd 写入。使用以下命令确认安装版本：

```sh
dsh plugin --profile web list dsh-open-in-vscode --depth 0
```

## 配置

所有部署选项都是经过校验的 Cordis 配置字段：

| 键 | 默认值 | 含义 |
| --- | --- | --- |
| `command` | `code` | 向后兼容的默认编辑器可执行文件。 |
| `args` | `[]` | 默认编辑器中位于 Workspace 目录之前的参数。 |
| `label` | `Visual Studio Code` | 默认编辑器的显示名称。 |
| `autoDetect` | `true` | 加入当前平台上可用的内置编辑器。 |
| `editors` | `[]` | 额外的白名单 `{ id, label, command, args }` 编辑器配置。 |
| `defaultEditor` | `vscode` | 当前浏览器尚未保存选择时使用的首选编辑器 id。 |

示例：

```yaml
- id: dsh-open-in-vscode
  name: dsh-open-in-vscode
  config:
    defaultEditor: cursor
    editors:
      - id: fleet
        label: Fleet
        command: fleet
        args: []
```

编辑器 id 只能包含小写字母、数字、点、下划线和连字符。重复 id、空名称和非法 id 会导致插件加载失败。向后兼容的默认配置占用 `vscode`，因此自定义编辑器不能重复使用该 id。

## 能力边界

浏览器只能获得编辑器 id、名称、可用状态和修复提示，命令和参数不会经过线协议。打开请求只携带 Workspace id 和编辑器 id；Host 通过 `ctx.workspaceRegistry` 解析 Workspace，并通过已经校验的编辑器白名单解析命令，然后才会启动进程。

插件只能打开仍然存在目录的已登记 Workspace。它不会读取、写入、克隆、同步或上传 Workspace 文件，也不注册模型工具、技能、提示词或模型可见事件。启动操作来自用户在 Workspace 菜单中的明确点击，因此不需要 Agent 审批。

首选编辑器保存在当前浏览器中。不同浏览器可以选择不同的默认值，而不改变 Host 配置。

## 开发

仓库使用相邻的 `../dsh` DeepSeek Harness 源码作为开发期链接依赖。

```sh
pnpm install
pnpm run check
```

`pnpm run check` 会执行类型检查、lint、测试和生产构建。file profile 安装不会自动构建包，因此需要提交 `lib/`。

`src/contract.ts` 中的严格 Typert 描述符由 Host manifest 和客户端 Remote 贡献共用。Host 编辑器注册表负责可执行文件发现和命令隐私，Workspace 注册表负责从 id 解析路径。行菜单插槽声明由 Harness 持有；该声明进入公开客户端包之前，插件使用一个窄类型适配器。

## License

MIT
