# Agile Grid / 灵巧网格

基于 Cell 的固定视口分页网格演示应用，用于验证拖拽、缩放、碰撞挤让、跨页放置与自动排布算法。

每页使用容器当前的可用宽高，没有水平或垂直滚动条。完整 v1.0 的排布顺序为从左到右、从上到下，放不下的内容进入后续页。

当前已完成 **Task 001：基础分页 JSON 渲染**。两页 Demo 共 10 个块，支持页导航、辅助线开关与容器尺寸测量。拖拽、缩放、挤让、自动缩小和持久化将按开发任务顺序实现。

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
- Task 001 尚无运行时重排：窗口缩小使当前 JSON 超出容量时显示“可用空间不足”，保留数据；恢复空间后重新渲染。自动缩小、挤让和跨页适配在 Task 003–005 实现。

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
3. [开发任务](docs/development-plan.md) 记录实施顺序；下一项为 Task 002：编辑与 Drag。
4. [Task 001 验证报告](docs/task001-validation.md) 区分核心测试、构建与实际 Chrome 验证。

v1.0 不包含 Widget 锁定或 Undo / Redo。

## 仓库

远端：`git@github.com:ZevixQuatol/Agile-Grid.git`  
分支：`main`  
冻结设计标记：`design-v1.0`

任务完成后创建本地 scoped commit；推送、发布与部署需要用户授权。

