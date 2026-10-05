# Agile Grid v1.0 设计

- 中文名称：灵巧网格
- 英文名称：Agile Grid
- 状态：冻结
- 冻结日期：2026-10-05
- Git 基线标记：`design-v1.0`，指向本次冻结提交；这是设计基线，不是软件发布版本。
- 需求来源：用户启动文档及 2026-10-05 的 12 项答复与总体调整。
- 开发顺序：[development-plan.md](./development-plan.md)
- 决策记录：[design-decisions.md](./design-decisions.md)

本文件是 v1.0 开发与验收的唯一设计基线。功能范围、交互规则与数据边界按本文件执行；旧版无限高度网格、Widget 锁定、Undo / Redo 及单独 Swap 策略不再属于当前范围。后续修改产品行为或范围，需要用户提出变更并记录变更原因，不能在实施过程中自行扩大范围。

## 1. 产品目标与交付形态

实现一个基于 Web 的可交互分页网格演示应用，用于验证 Cell 布局、拖拽、缩放、碰撞挤让、自动排布和分页算法。

每个页面的网格拥有固定可用宽度和高度。每页显示区域内没有水平或垂直滚动条，超出当前页容量的 Widget 放到后续页面。

v1.0 先交付可运行的演示应用，使用简单 Demo Widget，不发布 npm 组件包，不实现复杂 Widget 内容。验收只考虑桌面版 Chrome，重点是基础想法和逻辑算法。

Agile Grid 负责布局、交互和状态，Widget 自身的业务逻辑、数据源、网络请求与内部内容不属于布局引擎职责。

## 2. 技术栈与工具版本

应用使用 Next.js App Router、React、TypeScript strict、Zustand 和原生 CSS。采用 Pointer Events 统一处理指针事件，ResizeObserver 测量实际 GridViewport。

工具尽量采用最新、互相兼容的稳定版本，不使用预发布版本。2026-10-05 查询的初始化候选为：

| 工具 | 初始化候选 | 说明与来源 |
|---|---|---|
| Next.js | 16.3.8 | 应用框架；[官方安装文档](https://nextjs.org/docs/app/getting-started/installation) |
| React / React DOM | 19.3.0 | UI；[官方版本页](https://react.dev/versions) |
| TypeScript | 6.0.3 | 稳定 Compiler API 路径下的兼容候选；[npm registry](https://registry.npmjs.org/typescript/6.0.3) |
| Zustand | 5.0.15 | 应用状态；[官方发布](https://github.com/pmndrs/zustand/releases/tag/v5.0.15) |
| Vitest | 5.0.3 | 纯引擎单元测试；[官方发布](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3) |
| pnpm | 12.9.1 | 项目包管理器；[npm registry](https://registry.npmjs.org/pnpm/latest) |
| Node.js | 24.21.0 LTS | 开发运行环境候选；[官方下载](https://nodejs.org/en/download) |

TypeScript 的最新稳定版为 7.0.2。Next.js 对 TypeScript 7 的 CLI 检查路径仍被官方标注为 experimental，因此 v1.0 初始化先使用 TypeScript 6.0.3，并将 `experimental.useTypeScriptCli` 设为 `false`，使用 Compiler API 检查路径。不能通过 `ignoreBuildErrors` 跳过类型检查。来源：[Next.js useTypeScriptCli](https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli)。

初始化时重新核对候选版本与兼容性，固定实际直接依赖和锁文件。依赖版本是有日期的工程候选，实际安装、类型检查、测试和构建通过后才能报告兼容验证完成。当前机器的 Node.js 24.14.0 与 pnpm 10.32.1 是已读取的环境状态，尚未升级。

禁止使用 react-grid-layout、gridstack、Muuri 等布局引擎替代核心算法。核心算法自主实现。测试工具的内部构建依赖不改变 Next.js 作为应用框架的选择。

## 3. 架构与职责

```text
AgileGridShell
├── DockBar
├── Page Navigation
└── GridViewport
    ├── Grid Overlay
    ├── Grid Item
    ├── Placeholder
    ├── Drag Layer
    └── Resize Handle

Grid Engine      纯 TypeScript，坐标、排布、碰撞、分页、约束、校验
Interaction      React Hooks，指针、取消、编辑权限、临时布局
State            Zustand，统一管理页面、Widget 与已提交布局
Render           React Components，将 Cell 数据转换为像素
Persistence      LocalStorage，只保存已提交的布局与配置
```

核心布局算法放在 `src/core/grid/`，不得依赖 React、DOM、Next.js 或 Browser API。引擎接收明确的 Cell 边界参数，输出新布局，不修改调用方传入数据。

浏览器测量、Pointer Capture、requestAnimationFrame、LocalStorage 读写留在交互、渲染与持久化层。

## 4. 目录与命名

代码标识采用 `AgileGrid`、`AgileGridItem`、`AgileGridState`、`agileGridStore`；组件目录为 `agile-grid/`，包名称为 `agile-grid`。

```text
next.config.ts
next-env.d.ts
package.json
pnpm-lock.yaml
tsconfig.json
vitest.config.ts

src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── agile-grid/
│   │   ├── AgileGrid.tsx
│   │   ├── GridViewport.tsx
│   │   ├── GridItem.tsx
│   │   ├── GridOverlay.tsx
│   │   ├── GridPlaceholder.tsx
│   │   ├── DragLayer.tsx
│   │   ├── ResizeHandle.tsx
│   │   └── PageNavigation.tsx
│   ├── dock-bar/
│   │   ├── DockBar.tsx
│   │   └── DockMenu.tsx
│   └── widgets/
│       └── DemoWidget.tsx
├── core/grid/
│   ├── types.ts
│   ├── coordinates.ts
│   ├── constraints.ts
│   ├── collision.ts
│   ├── collision-resolver.ts
│   ├── placement.ts
│   ├── pagination.ts
│   ├── arrangement.ts
│   ├── compaction.ts
│   ├── resize.ts
│   ├── layout.ts
│   └── serializer.ts
├── hooks/
│   ├── useGridDrag.ts
│   ├── useGridResize.ts
│   ├── useGridKeyboard.ts
│   └── useGridMetrics.ts
├── stores/
│   └── agileGridStore.ts
└── styles/

test/grid/
docs/
```

`app/layout.tsx` 提供页面外壳，`app/page.tsx` 挂载演示界面。交互网格设置客户端组件边界。页面首次渲染不得直接读取 window 或 LocalStorage；持久化恢复和容器测量在客户端执行。

上述目录是分阶段落位建议，不要求 Task 001 创建后续阶段的空模块。

## 5. 数据模型

位置与尺寸使用整数 Cell 坐标和跨度。持久化布局不得保存 Widget 的像素 left、top、width、height。

```ts
export interface GridSize {
  w: number
  h: number
}

export interface GridRect extends GridSize {
  x: number
  y: number
}

export interface AgileGridItem extends GridRect {
  id: string
  type: string
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  draggable?: boolean
  resizable?: boolean
  allowedSizes?: GridSize[]
}

export interface GridPage {
  items: AgileGridItem[]
}

export interface GridLayout {
  pages: GridPage[]
}

export interface GridBounds {
  columns: number
  rows: number
}

export interface GridConfig {
  columns: number
  rowHeight: number
  gapX: number
  gapY: number
}

export type DockPosition = "top" | "bottom" | "left" | "right"

export interface DockBarState {
  position: DockPosition
  size: number
  visible: boolean
}

export interface AgileGridState {
  version: 1
  config: GridConfig
  dock: DockBarState
  layout: GridLayout
  activePage: number
  selectedItemId?: string
  editing: boolean
}
```

页序号内部从 0 开始，界面从 1 开始。每个 Widget 仅属于一个 page；其 x/y 是所在页内的局部坐标。id 在所有页中全局唯一。

不定义 locked 字段、锁定动作或 Undo / Redo History。布局事务的临时快照仅用于取消当前操作，不提供历史撤销。

`allowedSizes` 仅预留结构，v1.0 不启用离散尺寸限制。启用的尺寸约束为整数 Cell、min/max 与当前页面边界。draggable/resizable 默认为 true，可由 Demo 数据关闭对应主动操作，不阻止碰撞挤让算法重新排布。

产品版本 v1.0 与持久化格式 `version: 1` 分别表示产品设计和数据结构版本。

## 6. 固定视口与坐标换算

Shell 占满浏览器可用视口。Dock 占用的宽度或高度由 Shell 的 CSS Grid / Flex 布局扣除，GridViewport 使用剩余固定区域。所有页面共享当前 GridViewport 的尺寸。

每页不设置水平或垂直滚动，也不通过增高页面容纳额外 Widget。仅渲染活动页，其他页通过页码与上一页 / 下一页切换。

默认配置：

```ts
{
  columns: 12,
  rowHeight: 80,
  gapX: 8,
  gapY: 8
}
```

Dock 默认 top、48px、visible=true；不实现 Auto Hide。

以 GridViewport 的实际可用内容宽高计算：

```text
cellWidth = (width - (columns - 1) * gapX) / columns
cellHeight = rowHeight
rows = floor((height + gapY) / (rowHeight + gapY))

left = x * (cellWidth + gapX)
top = y * (rowHeight + gapY)
widthPx = w * cellWidth + (w - 1) * gapX
heightPx = h * rowHeight + (h - 1) * gapY
```

columns、rows 是页容量，rows 为运行时测量结果，不作为像素视口状态持久化。不能产生负宽度、0 行容量下的可编辑网格或超过底部的半行。

用 ResizeObserver 监听 GridViewport。视口、Dock 方向或配置变化后重新计算容量；容量变化触发稳定重新排布。运行时尺寸适配属于系统适配，不受手工编辑模式限制。

单项超过当前页容量时自动缩小，具体规则见第 9 节。

## 7. 排布与分页

默认顺序为：页从前到后，页内行从上到下，行内列从左到右。对不同尺寸矩形采用确定性的 first-fit 搜索，检查整个 w×h 区域是否空闲。

搜索顺序：

```text
page = 0, 1, 2, ...
  y = 0 ... rows - h
    x = 0 ... columns - w
```

仅在矩形完全处于同一页边界内且没有碰撞时放置。

当前行无法完整容纳时搜索下一行；当前页没有合法区域时搜索下一页；没有下一页时创建新页。Widget 不跨行拆分、不跨页切片。

新增 Widget 自动寻找位置，无需用户指定 x/y。空布局保持一页；自动排布时去除多余的末尾空页。跨页算法必须先执行单项尺寸适配，确认能容纳于一页，避免无限创建空页。

自动排布预制功能将全部 Widget 按当前视觉顺序（page、y、x，最后以 id 稳定排序）重新从第一页进行 first-fit 排布。相同输入与容量必须得到相同结果。

## 8. 碰撞、挤让与列数变化

使用 Cell 矩形 AABB 检测碰撞；边缘接触不算重叠。检测与处理分别实现。

拖放时首先尝试放置当前操作 Widget。被占用 Widget 按稳定顺序向后寻找合法空闲区域：从冲突位置开始，向右，换行，再跨页。必要时创建后续页，并继续处理连锁占用。

不能把 Widget 推到页面边界外，也不能以无限向下扩展解决碰撞。v1.0 的主要碰撞行为统一为挤让和跨页，不提供独立 Swap / Push / Reject 策略选择器。

调整 columns、rowHeight、gap 或 Dock 后，越界或被占用的 Widget 按新容量挤让、换行和跨页；不能因越界直接丢弃 Widget。

Drag / Resize 完成与删除后允许自动补位，补位可以改变刚操作 Widget 的位置。页内纵向补位必须保持矩形合法、无重叠；自动排布预制功能可对全部页面重新从左到右、从上到下排布。Placeholder 必须展示约束、挤让、分页和补位之后的最终可提交位置。

引擎在单次交互中用明确的处理队列与已处理项记录避免循环。操作无法生成合法布局时返回失败，保留操作前完整布局，不提交部分结果。

## 9. 尺寸与自动适配

Widget minW/minH 默认为 1，maxW/maxH 不得低于声明的 min 值。Resize 支持右侧、底部与右下角，起始锚点保持不变，再按 Cell 吸附和约束计算候选尺寸。

`allowedSizes` 不强制生效。尺寸既受 min/max 约束，也必须能完整容纳于单页。

用户已明确选择：单个 Widget 超过一整页容量时，自动缩小 Widget 以适应当前页。

- 新增、Resize、手工配置变化或浏览器 / Dock 尺寸变化导致单项过大时，自动裁减超出容量的 w 或 h，分别按横纵跨度调整，不要求等比缩放。
- 页容量是最高尺寸边界；声明的 min/max 保留，按当前页容量计算有效范围。`effectiveMinW = min(minW ?? 1, columns)`，高度同理；max 值同样限制在页容量内。
- 缩小结果必须满足有效 min/max，并保持正整数跨度。缩小后的项目再按挤让、换行和跨页规则重新放置，不丢弃内容。
- 自动适配后的 w/h 属于新的已提交布局，会持久化。空间增大不直接恢复缩小前的跨度；只按当前有效约束重新校验，用户可在编辑模式 Resize。
- 如果视口无法形成正 Cell 宽度或连一行都容纳不了，显示“可用空间不足”，暂停布局编辑与排布，保留完整已提交数据；空间恢复后重新适配。
- 不生成 0×0 Widget，不无限创建空页，不以滚动条解决容量问题。

有效 min/max 的容量优先级和非等比裁减是落实自动缩小要求的工程默认值。

## 10. 编辑模式与交互

默认 `editing=false`。普通模式允许 Widget 内部交互、页面切换、Dock 位置切换和进入编辑模式；禁止新增、删除、拖拽、Resize、自动排布、手动补位和修改网格参数。

进入编辑模式后才能执行布局编辑。编辑模式使用整块 Widget 作为拖拽区域，不要求标题栏或独立拖拽手柄；内部内容用于布局操作。Resize Handle 和系统操作按钮优先处理自身操作，不能同时启动 Drag。

保留单项选择，用于显示尺寸手柄与删除入口。点击空白清除选中项。普通模式隐藏编辑手柄和编辑控制。

Pointer Events 处理 pointerdown / move / up / cancel，并使用 Pointer Capture 保持完整事件序列。保留指针按下时相对 Widget 的偏移，避免拖拽开始跳动。

页面切换使用上一页、下一页与当前页 / 总页数。编辑时允许切换到目标页；活动 Drag / Resize 遇到切页、退出编辑、pointercancel、丢失 capture、Escape 或视口容量变化时，先取消该事务，再执行切换 / 适配。v1.0 不实现悬停翻页或边缘自动翻页。

Resize 按整数 Cell 吸附；禁止拖出当前页左右及上下边界。目标页放不下的受影响内容由分页算法转移到后续页。

## 11. 临时布局与提交

```text
Pointer Down
→ 记录已提交布局
→ 创建临时布局
→ Pointer Move 更新预览
→ 换算 Cell
→ 约束、碰撞挤让、分页、补位
→ 显示 Placeholder
→ Pointer Up 一次提交
```

取消当前操作恢复整个事务开始前的状态，包括其他被挤让 Widget 和临时创建的页面。

pointermove 不写 LocalStorage，不提交历史，不直接修改最终布局。取消和无变化操作不触发布局持久化。

## 12. 渲染与性能

Widget 使用 absolute 定位和 translate3d 渲染，大小来自纯坐标换算结果；Grid Overlay 可使用 CSS Grid。页面 Shell 与 Dock 使用 CSS Grid / Flex。

拖动中的 Drag Layer 使用 transform，不施加拖动 transition；其他块的位置变化可使用约 150ms 的 transform transition。

指针预览通过 requestAnimationFrame 合并更新；Zustand 使用 selector 订阅，Widget 仅订阅自身必要状态。v1.0 使用简单 AABB 遍历，不提前实现 Spatial Hash、QuadTree、复杂动画或性能指标体系。

每次只渲染活动页，不以隐藏的超宽 / 超高内容造成页面滚动。

## 13. Dock Bar

支持 top、bottom、left、right，默认 top，厚度默认 48px，可在编辑模式配置。方向变化只调整 Shell 布局，然后由 ResizeObserver 重新测量 GridViewport。

主要入口：

```text
Agile Grid
编辑 / 完成
上一页 / 当前页与总页数 / 下一页
新增 Widget
自动排布
Grid Overlay
Dock Position
```

Dock 内容空间不足时使用简短按钮及菜单，不让固定网格页产生滚动条。不提供 Widget Lock、Global Lock、Undo 或 Redo 按钮。编辑模式替代原全局锁定入口。

## 14. 状态与持久化

Zustand 统一管理页面、Widget、配置、Dock 与当前交互状态。Widget 不自行维护布局位置和尺寸。

LocalStorage 保存格式：

```json
{
  "version": 1,
  "grid": {
    "columns": 12,
    "rowHeight": 80,
    "gapX": 8,
    "gapY": 8
  },
  "dock": {
    "position": "top",
    "size": 48,
    "visible": true
  },
  "pages": [
    {
      "items": [
        {
          "id": "widget-1",
          "type": "medium",
          "x": 0,
          "y": 0,
          "w": 2,
          "h": 2,
          "minW": 1,
          "minH": 1,
          "draggable": true,
          "resizable": true
        }
      ]
    }
  ]
}
```

应用状态中的 config 与持久化 JSON 的 grid 由 serializer 显式转换。只保存已提交数据；不保存 activePage、Selection、editing、临时交互或撤销历史。

启动时读取、解析、验证、恢复；无数据或结构非法时回退 Demo Layout，并给出简短提示。刷新后普通模式启动、显示第一页、无选中项。恢复后根据当前页容量重新适配，不能假定保存时的视口尺寸仍相同。

数据结构改变时显式迁移格式版本，禁止无提示吞掉 Widget。

## 15. 校验与错误处理

至少验证：

- id 在全布局中唯一；pages 至少保留一页。
- x/y/w/h 是有限整数，x/y >= 0，w/h >= 1。
- 正常可用状态下，每个 Widget 满足 x+w <= columns、y+h <= rows。
- 每页不存在非法矩形重叠。
- min/max 关系合法，配置有限、列数和行高为正、gap 非负。
- 单项过大时先自动缩小；零页容量按第 9 节处理并保留数据。
- 非法操作、取消操作、排布失败均不提交部分布局。

## 16. 核心 API

API 以实际实现所需参数为准，所有布局操作必须接收页容量并返回可验证的新布局或明确失败：

```text
gridToPixel
pixelToGrid
isColliding
getCollisions
isAreaFree
findAvailablePosition
addItem
removeItem
moveItem
resizeItem
resolveCollision
paginateLayout
autoArrange
compactLayout
validateLayout
serializeLayout
restoreLayout
```

确定性的稳定顺序与同输入同输出是算法契约。引擎不直接生成随机 id 或读取屏幕尺寸；新增 Widget id 由应用层提供。

## 17. 测试与调试

核心引擎使用 Vitest，在 Node 环境下测试：

- 坐标换算：间距、跨多个 Cell、边界与像素回换。
- AABB：不相交、边缘接触、部分重叠、覆盖、包含、同位置和不同大小。
- first-fit：空页、本行空位、换行、跨 Cell、整页已满、创建下一页。
- 挤让：单项冲突、连锁冲突、页末换行、跨页、混合尺寸、终止性、无数据丢失。
- 约束：有限页容量、min/max、单项过大、零容量、减少列数。
- 自动排布与补位：稳定顺序、确定性、无重叠、所有 id 保留、尾空页处理。
- 取消：恢复整个事务，包括临时挤让和创建的页。
- 序列化：页内局部坐标、格式校验、坏数据回退、恢复后容量适配。

开发调试信息可显示页容量、页码、Cell 尺寸、当前项、候选坐标、碰撞项和 Placeholder。调试 UI 开关不进入业务持久化。

真实 Chrome 验证应区分于算法测试和构建结果。v1.0 暂不承诺 Widget 数量或帧率指标，以固定 Demo 场景验证正确性。

## 18. v1.0 功能范围

必须完成：

- Next.js 演示应用与简单多尺寸 Demo Widget。
- Cell 模型、固定视口、有限行列容量、分页、页导航、无双向滚动条。
- 整块拖拽、吸附、Drag Layer、Placeholder、取消。
- 右侧 / 底部 / 右下角 Resize，有效 min/max、自动缩小与单页边界。
- AABB 碰撞、连锁挤让、换行、跨页。
- Add / Remove、自动放置、自动补位、自动排布预制功能。
- 编辑模式、单项选择、Delete / Escape 操作权限。
- 四向 Dock、实际容器响应与容量适配。
- LocalStorage、version、校验、恢复、坏数据回退。
- 核心算法单元测试与 Chrome 功能验收。

## 19. v1.0 不实现

- Widget 锁定、独立 Global Lock、Undo / Redo。
- 独立 Swap 策略、复杂方向智能碰撞或可配置碰撞策略系统。
- 页面内水平 / 垂直滚动、无限向下扩展。
- 复杂 Widget 内容、用户登录、服务端数据库、云同步、多人协作。
- npm 组件发布、Widget SDK、插件系统、模板市场。
- 移动端完整适配、Firefox / Safari 专项验收、复杂 Breakpoint 独立布局。
- 嵌套 Grid、多 Grid 之间拖拽、多选、分组拖拽或缩放。
- Dock Auto Hide / Floating、复杂动画、空间索引与深入性能优化。
- 悬停翻页、边缘自动翻页、拖拽期间切页连续操作。

分页是本版核心能力，已替代原启动文档对多页面布局的延期安排。

## 20. 开发顺序与 Task 001

按 [development-plan.md](./development-plan.md) 的顺序开发，每项完成并验证后进入下一项。

Task 001 只初始化 Next.js 工程、模型、容器测量、Cell 坐标换算、Demo JSON、分页基础显示与页导航。给定合法的 page/x/y/w/h 数据，应准确渲染；实际网格容器无水平或垂直滚动条。

Task 001 不提前实现 Drag、Resize、碰撞、自动放置和持久化。

## 21. v1.0 验收

使用 Chrome 完成以下流程：

1. 打开演示应用，固定视口中显示多尺寸 Widget；网格页无双向滚动条。
2. 进入编辑模式，从整块 Widget 拖拽；吸附、Placeholder 和取消正常。
3. 拖到已占用区域，受影响块向后挤让；跨行、跨页后无重叠、无越界、无丢失。
4. Resize 触发约束与挤让；取消恢复完整原布局。
5. 连续新增至当前页放不下，自动创建并使用新页；页导航能访问全部内容。
6. 删除后补位；点击自动排布后，按横向从左到右、纵向从上到下重新排布。
7. 切换 Dock 四个方向及调整列数，容量变化后重新适配和分页。
8. 退出编辑模式，所有布局编辑入口失效，Widget 普通交互与翻页仍可用。
9. 刷新后恢复已提交的配置、Dock 与全部页面，默认普通模式、第一页、无选中项。
10. 不可容纳状态和坏持久化数据按已定义规则处理，不导致数据静默丢失。

完成上述功能、核心测试和 Chrome 验证后，才能将 Agile Grid v1.0 标为实现完成。设计冻结不代表上述功能已实现。

