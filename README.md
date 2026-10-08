# Agile Grid / 灵巧网格

基于 Cell 的固定视口分页网格演示应用，用于验证拖拽、缩放、碰撞挤让、跨页放置与自动排布算法。

每页使用容器当前的可用宽高，没有水平或垂直滚动条。完整 v1.0 的排布顺序为从左到右、从上到下，放不下的内容进入后续页。

当前已完成 **Task 001–010，v1.0 演示应用实现与 Chrome 验收通过**：基础分页、拖拽、Resize、碰撞挤让、新增 / 删除、自动缩小、排布预制功能、四向 Dock、编辑权限 / 快捷键和本地持久化。初始两页 Demo 共 10 个块；完整验收结果见 [Task 010 验证报告](docs/task010-validation.md)。

## 本地运行

使用 Node.js 24 LTS 和项目固定的 pnpm 12.9.1。在仓库根目录运行：

```powershell
npx --yes pnpm@12.9.1 install --frozen-lockfile
npx --yes pnpm@12.9.1 dev
```

打开启动日志中的地址（默认端口 3000）。通过 npx 调用固定版本，无需替换全局 pnpm。

验证与生产预览：

```powershell
npx --yes pnpm@12.9.1 typecheck
npx --yes pnpm@12.9.1 test
npx --yes pnpm@12.9.1 build
npx --yes pnpm@12.9.1 start --port 3100
```

生产预览需要先构建。修改源代码后，使用开发服务器，或停止生产服务器、重新构建后启动。

## 当前演示

- 默认 12 列、80px 行高，横纵间距均为 8px；行数由网格容器的实际高度计算。
- `src/data/demo-layout.json` 明确指定每页的 Widget 和整数 `x/y/w/h`。坐标从 0 开始，必须在当前页容量内。
- 两页展示 1×1、2×1、2×2、4×2、4×4；上一页 / 下一页按钮在首尾页禁用。
- 初始为浏览模式。辅助线开关只影响显示，不修改布局。
- 编辑模式支持整块拖拽、选中后的三个 Resize 手柄、新增与删除；操作超出容量时通过缩小、挤让和后续页容纳内容。
- 顶栏“本页补位”图标仅将当前页的块向上填空，保持列位置和尺寸；“自动排布全部页面”图标按当前视觉顺序，从第一页执行矩形 first-fit，并清理末尾空页。浏览模式隐藏这两个入口。
- “Dock 设置”图标提供顶部 / 底部 / 左侧 / 右侧切换；编辑模式可调整 40–160px 厚度，默认 48px。同一菜单内输入正整数“网格列数”，点击“应用列数”或按 Enter 提交；输入过程中不改变布局，减少列数后自动缩小、挤让与分页，保留全部 Widget id。Dock 空间不足时，从同一菜单访问折叠的操作。
- 编辑模式下，点击或 Tab 聚焦选中块后可按 Delete 删除；Escape 取消拖拽 / 缩放并清除选择。内容在编辑期间不可交互；输入控件和打开的菜单保留原生按键行为。普通模式下恢复 Widget 内容交互。
- 视口容量变化时自动缩小超限块并分页；零容量显示“可用空间不足”，暂停排布且保留布局，空间恢复后继续显示。
- 已提交的布局、网格和 Dock 配置自动保存在当前浏览器的 LocalStorage；刷新后恢复配置与全部页，从第一页、浏览模式启动。拖动预览、选择、编辑状态、页码和辅助线开关不保存。
- 无保存数据时载入 Demo 并提示；坏数据或未知格式版本保留原文，使用 Demo 继续运行，首次布局 / 配置更改后保存新数据。存储不可用或写入失败时保持内存操作，并持续提示更改仅保留在本次会话。

## 实现与依赖

Next.js App Router、React、strict TypeScript、scoped Zustand 和原生 CSS。核心模型与坐标换算位于 `src/core/grid`，不依赖 React、DOM、Next.js 或 Browser API；`useGridMetrics` 负责 ResizeObserver 测量，应用层 Renderer 负责 Widget 内容。

| 工具 | 固定版本 |
|---|---|
| Next.js | 16.3.8 |
| React / React DOM | 19.3.0 |
| Zustand | 5.0.15 |
| TypeScript | 6.0.3 |
| Vitest | 5.0.3 |
| pnpm | 12.9.1 |

版本在 Task 001 开始时通过 npm registry 核对。TypeScript 采用兼容稳定的 6.0.3，并关闭 Next.js 的实验性 TS7 CLI 路径；保留完整类型检查。实际 Node.js 为既有的 24.14.0 LTS，没有修改全局工具环境。依赖精确固定并提交 pnpm 锁文件。

## 设计与开发记录

1. [冻结的 v1.0 设计](docs/design-v1.0.md) 是唯一产品基线，冻结于 2026-10-05。
2. [需求决策](docs/design-decisions.md) 记录用户确认的分页、挤让与自动缩小规则。
3. [开发任务](docs/development-plan.md) 记录实施顺序；Task 001–010 已全部完成。
4. [Task 001 验证报告](docs/task001-validation.md) 区分核心测试、构建与实际 Chrome 验证。
5. [Task 006 验证报告](docs/task006-validation.md) 记录排布预制功能、编辑权限与 Chrome 验收。
6. [Task 007 验证报告](docs/task007-validation.md) 记录四向 Dock、厚度配置、紧凑菜单与 Chrome 验收。
7. [Task 008 验证报告](docs/task008-validation.md) 记录编辑权限、键盘隔离、指针捕获与取消 / 提交。
8. [Task 009 验证报告](docs/task009-validation.md) 记录本地持久化、格式校验、恢复顺序、容量适配和存储失败处理。
9. [Task 010 验证报告](docs/task010-validation.md) 记录冻结设计十项完整流程、列数调整、动画帧预览及最终检查。

最终验证：5 个文件、104 项 Node 测试、类型检查与生产构建通过；真实 Google Chrome 154 完成十项流程，控制台 0 错误 / 0 警告。浏览器证据来自本地生产预览与隔离的 Playwright 会话；复杂 Widget 业务、其他浏览器、部署及规模性能指标不在本次验收范围。

v1.0 不包含 Widget 锁定或 Undo / Redo。

## 仓库

远端：`git@github.com:ZevixQuatol/Agile-Grid.git`  
分支：`main`  
冻结设计标记：`design-v1.0`

任务完成后创建本地 scoped commit；推送、发布与部署需要用户授权。
