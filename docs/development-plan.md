# Agile Grid v1.0 开发任务

基线：[design-v1.0.md](./design-v1.0.md)  
状态：设计冻结；Task 002–005 已完成（2026-10-08）

下一项：Task 006，排布预制功能

以下任务按顺序实施。后续阶段没有实现时，不能将完整 v1.0 标为可用。

| 顺序 | 任务 | 交付与完成标准 |
|---|---|---|
| 001 ✓ | 工程与基础分页渲染 | 已完成；Next.js、strict TS、模型、测量、坐标换算、Demo JSON、固定网格、页导航；给定合法数据准确渲染且无滚动。见 [验证报告](./task001-validation.md) |
| 002 ✓ | 编辑与 Drag | 已完成；编辑权限、整块 Pointer 拖拽、吸附、选择、Drag Layer、Placeholder、边界和完整取消 |
| 003 ✓ | 碰撞与跨页挤让 | 已完成；拖拽事务接入 AABB 碰撞、稳定挤让、跨页新建和失败回滚 |
| 004 ✓ | Resize | 已完成；右 / 下 / 右下手柄、整数吸附、min/max、容量约束、挤让和取消 |
| 005 ✓ | Add / Remove 与自动适配 | 矩形 first-fit、自动新页、删除后补位与尾空页维护；视口容量变化时缩小并分页，零容量保留数据 |
| 006 | 排布预制功能 | 页内补位、全页自动排布；左到右、上到下，结果稳定可复现 |
| 007 | Dock | 四向布局、厚度配置、页导航与编辑入口；尺寸变化触发容量适配 |
| 008 | 编辑权限与快捷键完善 | 普通模式限制、Delete、Escape、输入事件隔离；无锁定 / 历史系统 |
| 009 | Persistence | LocalStorage、version、序列化、验证、恢复、坏数据回退与当前容量适配 |
| 010 | Chrome 验收 | 冻结设计第 21 节流程、无双向滚动、完整数据保留、测试与构建证据 |

## Task 001：可直接开工的任务说明

目标：任何合法页内 x/y/w/h JSON 均准确渲染，不依赖拖拽或碰撞算法。

实现范围：

1. 建立 Next.js App Router 工程，项目 package name 为 `agile-grid`，使用 src 目录和原生 CSS。
2. 核对最新兼容稳定依赖，记录 TypeScript 兼容选择，固定版本与 pnpm 锁文件；不改变全局工具环境。
3. 建立 GridSize、GridRect、AgileGridItem、GridPage、GridLayout、GridConfig、GridBounds 与 GridMetrics。
4. 实现纯函数 gridToPixel / pixelToGrid；浏览器尺寸测量留在 useGridMetrics。
5. 实现固定 Shell 与 GridViewport；实际容量由容器测量，不使用无限高度，也不生成滚动条。
6. 使用明确分配到页面的 Demo JSON 渲染不同尺寸块，加入最小页导航与可开关 Grid Overlay。
7. 创建 scoped Zustand 状态，保留未来 Renderer 边界，初始普通模式。
8. 加入坐标和页边界的核心单元测试，执行类型检查、测试、构建及 Chrome 基础渲染验证。

预期首批文件：

```text
package.json / pnpm-lock.yaml / next.config.ts / tsconfig.json
src/app/layout.tsx / page.tsx / globals.css
src/core/grid/types.ts / coordinates.ts
src/components/agile-grid/AgileGrid.tsx
src/components/agile-grid/GridViewport.tsx / GridItem.tsx / GridOverlay.tsx
src/components/agile-grid/PageNavigation.tsx
src/components/widgets/DemoWidget.tsx
src/hooks/useGridMetrics.ts
src/stores/agileGridStore.ts
test/grid/coordinates.test.ts
```

本任务不提前实现 Drag、Resize、碰撞、自动放置、Dock 全功能和 LocalStorage。完整运行时缩小、挤让和跨页适配在 Task 003–005 完成；Task 001 不据此声称整套响应算法已完成。

验收：

- [x] 应用页显示 Agile Grid / 灵巧网格。
- [x] 默认 12 列、80px 行高、8px gap，实际行容量与可用高度一致。
- [x] 修改 Demo JSON 的页、坐标与跨度，正确反映位置和大小。
- [x] 1×1、2×1、2×2、4×2、4×4 在足够容量下准确渲染。
- [x] 多页导航可访问所有 Demo 项，网格页没有水平 / 垂直滚动。
- [x] ResizeObserver 响应容器尺寸并计算有限页容量；对当前容量下合法的 Demo JSON 完成基础渲染验证。
- [x] 纯函数测试不依赖 React / DOM。
- [x] 类型检查、核心测试、生产构建通过。
- [x] Chrome 验证证据与算法 / 构建证据分别记录。

Task 001 的像素测量、JSON 修改实验、窗口恢复和运行环境详见 [验证报告](./task001-validation.md)。这仅确认基础分页渲染完成，不代表后续布局交互与完整 v1.0 已完成。

## 初始化后的命令约定

以下脚本已实现并完成验证，使用 package.json 指定的 pnpm 12.9.1：

```text
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

启动方式和固定版本 pnpm 的调用方式见 [README](../README.md)。服务器端口以实际启动日志为准。

## Git 与交付约定

- 默认分支 main，origin 为用户提供的 GitHub SSH 远端。
- 完成可分离任务及必要验证后，创建本地 scoped commit。
- 只暂存本任务文件；不整仓暂存共享工作区修改。
- 推送、发布和部署需要用户授权；Task 001 交付仅作本地提交。
