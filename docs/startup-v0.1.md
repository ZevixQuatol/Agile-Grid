# Flexible Grid v0.1

> 2026-10-05 技术栈修订：Web 原型使用 Vite + React + TypeScript。本文保留原启动文档的功能范围和 Phase 1–10 开发顺序；行为疑问另见 [requirements-questions.md](./requirements-questions.md)，其中推荐方案尚未确认为需求。

## 1. 项目概述

项目名称：

**Flexible Grid / 灵活网格**

项目目标：

实现一个基于 Web 技术的高度自定义、可交互的模块化网格布局系统。

整个视口被划分为若干个最小网格单元 `Cell`，所有布局项 `Grid Item / Widget` 均基于 Cell 进行排列。

Widget 内部内容不属于 Flexible Grid 的职责范围。

Flexible Grid 只负责：

- 布局
- 拖拽
- 吸附
- 缩放
- 碰撞检测
- 碰撞处理
- 块交换
- 自动补位
- 自动放置
- 布局约束
- 布局持久化
- Undo / Redo
- Dock Bar
- 视口响应

项目第一阶段采用：

```text
React
Vite
TypeScript
```

实现 Web 原型。

---

# 2. 核心设计原则

Flexible Grid 必须遵循以下原则。

## 2.1 Cell 是最小布局单位

所有布局均基于 Cell，而不是直接基于像素。

布局项使用：

```ts
x
y
w
h
```

表示：

```text
x = 起始列
y = 起始行
w = 横向占用 Cell 数量
h = 纵向占用 Cell 数量
```

例如：

```ts
{
  id: "widget-1",
  x: 0,
  y: 0,
  w: 2,
  h: 2
}
```

禁止在持久化布局数据中直接保存：

```text
left: 237px
top: 166px
width: 412px
height: 168px
```

像素坐标只允许存在于渲染层。

---

## 2.2 Grid Engine 与 React 解耦

所有核心布局算法必须放在：

```text
core/grid/
```

目录中。

核心算法不得依赖：

```text
React
DOM
Vite
Browser API
```

Grid Engine 应尽可能使用纯函数：

```ts
Layout -> Layout
```

例如：

```ts
moveItem(layout, id, x, y)

resizeItem(layout, id, w, h)

compactLayout(layout)

resolveCollision(layout, item)
```

这样未来可以复用到：

```text
React
Vue
Electron
Tauri
Canvas
WebGL
其他 UI 框架
```

---

# 3. 核心概念

统一使用以下术语。

| 中文 | 英文 |
|---|---|
| 灵活网格 | Flexible Grid |
| 网格 | Grid |
| 网格单元 | Cell |
| 布局项 | Grid Item |
| 小组件 | Widget |
| 网格坐标 | Grid Coordinate |
| 网格宽度 | Width Span / w |
| 网格高度 | Height Span / h |
| 拖拽 | Drag |
| 吸附 | Snap |
| 缩放 | Resize |
| 占位符 | Placeholder |
| 碰撞检测 | Collision Detection |
| 碰撞处理 | Collision Resolution |
| 交换 | Swap |
| 推挤 | Push |
| 自动补位 | Compaction |
| 自动放置 | Auto Placement |
| 布局约束 | Layout Constraint |
| 布局持久化 | Layout Persistence |
| 停靠栏 | Dock Bar |

---

# 4. 总体架构

```text
FlexibleGrid
│
├── Grid Engine
│   ├── Grid Model
│   ├── Coordinate System
│   ├── Placement Engine
│   ├── Collision Detector
│   ├── Collision Resolver
│   ├── Compaction Engine
│   ├── Constraint Engine
│   └── Layout Serializer
│
├── Interaction
│   ├── Drag Controller
│   ├── Resize Controller
│   ├── Keyboard Controller
│   └── Pointer Controller
│
├── UI
│   ├── Grid Viewport
│   ├── Grid Item
│   ├── Placeholder
│   ├── Drag Layer
│   ├── Grid Overlay
│   └── Resize Handle
│
├── Dock Bar
│
├── Store
│
└── Persistence
```

---

# 5. 技术栈

第一版技术栈：

```text
Vite
React
TypeScript
CSS
CSS Grid
CSS Transform
Pointer Events
Zustand
LocalStorage
```

推荐：

```text
Vite React + TypeScript 模板（react-ts）
TypeScript strict mode
```

使用 Vite 开发服务器和构建工具。Web 原型采用客户端 React 渲染，应用入口为根目录 `index.html` 和 `src/main.tsx`，根组件为 `src/App.tsx`。

### 工具版本策略

- 尽量使用初始化时最新、相互兼容的稳定版本；不采用 alpha、beta、RC、canary 或 nightly。
- 下表是 2026-10-05 查询官方发布页和 npm registry 得到的稳定版本快照，实际初始化前再次核对。
- Node.js 建议选择当前最新 LTS 系列，当前建议为 24 LTS。
- 包管理器建议使用 pnpm；Grid Engine 单元测试建议使用 Vitest。这两项是工程建议。
- 初始化时固定实际采用的直接依赖版本，提交锁文件；后续升级需要重新验证类型检查、单元测试和构建。
- 如最新稳定版本存在明确兼容冲突，优先采用最新兼容稳定版，并记录具体原因。

| 工具 | 核对版本 | 用途 / 来源 |
|---|---|---|
| Vite | 8.3.2 | 开发与构建；[官方发布](https://github.com/vitejs/vite/releases/tag/v8.3.2) |
| React / React DOM | 19.3.0 | UI 渲染；[官方版本页](https://react.dev/versions) |
| TypeScript | 7.0.2 | 类型检查，启用 strict；[npm registry](https://registry.npmjs.org/typescript/latest) |
| Zustand | 5.0.15 | 状态管理；[官方发布](https://github.com/pmndrs/zustand/releases/tag/v5.0.15) |
| @vitejs/plugin-react | 6.1.1 | Vite React 插件；[npm registry](https://registry.npmjs.org/@vitejs%2fplugin-react/latest) |
| Vitest | 5.0.3 | 核心算法单元测试；[官方发布](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3) |
| pnpm | 12.9.1 | 建议的包管理器；[npm registry](https://registry.npmjs.org/pnpm/latest) |
| Node.js | 24.21.0 LTS | 建议的开发运行环境；[官方下载页](https://nodejs.org/en/download) |

CSS、CSS Grid、CSS Transform、Pointer Events、ResizeObserver 和 LocalStorage 属于浏览器能力，不单独指定 npm 版本。

Vite 负责转换和构建源码，TypeScript 类型检查需要作为独立检查执行。上述版本已核对发布信息和主要 Node / peer 版本要求，尚未通过实际项目安装、类型检查、测试及构建验证。

第一版不要直接使用大型 Grid Layout 第三方库。

例如暂时不要依赖：

```text
react-grid-layout
gridstack
Muuri
```

原因：

Flexible Grid 本身的目标就是验证并实现布局引擎。

可以使用底层通用库，但核心布局算法必须自主实现。

---

# 6. 项目目录建议

```text
index.html
vite.config.ts
package.json
pnpm-lock.yaml             # 采用 pnpm 时生成
tsconfig.json
tsconfig.app.json
tsconfig.node.json

src/
│
├── main.tsx              # React 应用入口
├── App.tsx               # 原型页面与 Shell 组合
│
├── components/
│   │
│   ├── flexible-grid/
│   │   ├── FlexibleGrid.tsx
│   │   ├── GridViewport.tsx
│   │   ├── GridItem.tsx
│   │   ├── GridOverlay.tsx
│   │   ├── GridPlaceholder.tsx
│   │   ├── DragLayer.tsx
│   │   └── ResizeHandle.tsx
│   │
│   ├── dock-bar/
│   │   ├── DockBar.tsx
│   │   └── DockMenu.tsx
│   │
│   └── widgets/
│       ├── Widget.tsx
│       ├── DemoWidget.tsx
│       ├── AppWidget.tsx
│       └── PanelWidget.tsx
│
├── core/
│   └── grid/
│       ├── types.ts
│       ├── coordinates.ts
│       ├── collision.ts
│       ├── collision-resolver.ts
│       ├── placement.ts
│       ├── compaction.ts
│       ├── resize.ts
│       ├── constraints.ts
│       ├── layout.ts
│       └── serializer.ts
│
├── hooks/
│   ├── useGridDrag.ts
│   ├── useGridResize.ts
│   ├── useGridKeyboard.ts
│   └── useGridMetrics.ts
│
├── stores/
│   └── flexibleGridStore.ts
│
├── utils/
│   └── id.ts
│
└── styles/
```

---

# 7. 基础数据结构

## 7.1 Grid Item

```ts
export interface FlexibleGridItem {
  id: string

  type: string

  x: number
  y: number

  w: number
  h: number

  minW?: number
  minH?: number

  maxW?: number
  maxH?: number

  draggable?: boolean
  resizable?: boolean
  locked?: boolean

  allowedSizes?: GridSize[]
}
```

---

## 7.2 Grid Size

```ts
export interface GridSize {
  w: number
  h: number
}
```

---

## 7.3 Grid Rect

```ts
export interface GridRect {
  x: number
  y: number
  w: number
  h: number
}
```

---

## 7.4 Grid Config

```ts
export interface GridConfig {
  columns: number

  rowHeight: number

  gapX: number
  gapY: number

  compactMode: CompactMode

  collisionStrategy: CollisionStrategy
}
```

---

# 8. Compact Mode

```ts
export type CompactMode =
  | "none"
  | "vertical"
  | "horizontal"
```

第一版优先实现：

```text
none
vertical
```

horizontal 可以后续实现。

---

# 9. Collision Strategy

```ts
export type CollisionStrategy =
  | "swap"
  | "push"
  | "reject"
```

后续可以扩展：

```text
nearest
replace
compact
custom
```

---

# 10. Dock Bar

Flexible Grid 包含一个 Dock Bar。

Dock Bar 类似旧版 Windows Taskbar。

支持停靠在视口：

```text
top
bottom
left
right
```

类型：

```ts
export type DockPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
```

状态：

```ts
export interface DockBarState {
  position: DockPosition

  size: number

  autoHide: boolean

  visible: boolean
}
```

第一版：

```text
autoHide = false
```

暂不实现自动隐藏。

---

# 11. Flexible Grid 全局状态

```ts
export interface FlexibleGridState {
  version: number

  config: GridConfig

  dock: DockBarState

  items: FlexibleGridItem[]

  selectedItemId?: string

  editing: boolean
}
```

---

# 12. 第一版 Demo Widget

先不要实现复杂 Widget 内容。

只准备测试 Widget。

例如：

```text
App Widget
1 × 1

Small Widget
2 × 1

Medium Widget
2 × 2

Wide Widget
4 × 2

Large Widget
4 × 4
```

示例：

```ts
const demoItems: FlexibleGridItem[] = [
  {
    id: "app-1",
    type: "app",
    x: 0,
    y: 0,
    w: 1,
    h: 1
  },

  {
    id: "widget-1",
    type: "medium",
    x: 1,
    y: 0,
    w: 2,
    h: 2
  },

  {
    id: "widget-2",
    type: "wide",
    x: 3,
    y: 0,
    w: 4,
    h: 2
  }
]
```

---

# 13. Grid 基础系统

首先实现最基础的 Grid。

功能：

- [ ] Grid 容器
- [ ] 配置列数
- [ ] 配置 Row Height
- [ ] 配置 Gap
- [ ] 根据视口宽度计算 Cell Width
- [ ] Grid 自动扩展高度
- [ ] 支持任意数量 Widget
- [ ] 支持开发模式显示 Cell 辅助线
- [ ] 支持关闭辅助线

---

# 14. Grid Metrics

Grid 必须能够根据容器尺寸计算：

```ts
interface GridMetrics {
  width: number

  cellWidth: number
  cellHeight: number

  gapX: number
  gapY: number

  columns: number
}
```

Cell Width：

```text
containerWidth
-
所有 Gap 宽度
----------------
columns
```

---

# 15. Grid → Pixel

实现：

```ts
gridToPixel(
  rect: GridRect,
  metrics: GridMetrics
): PixelRect
```

例如：

```ts
{
  x: 2,
  y: 1,
  w: 3,
  h: 2
}
```

转换成：

```text
left
top
width
height
```

---

# 16. Pixel → Grid

实现：

```ts
pixelToGrid(
  x: number,
  y: number,
  metrics: GridMetrics
): GridPoint
```

用于：

```text
Drag
Resize
Drop
```

实现 Snap To Grid。

---

# 17. Drag 系统

实现完整拖拽。

拖动流程：

```text
Pointer Down
↓
进入 Drag 状态
↓
记录原始位置
↓
Pointer Move
↓
计算 Pixel 坐标
↓
Pixel → Grid
↓
Snap
↓
Collision Detection
↓
Collision Resolution
↓
更新 Placeholder
↓
Pointer Up
↓
Commit Layout
```

功能：

- [ ] Pointer Events
- [ ] 拖动开始
- [ ] 拖动过程
- [ ] 拖动结束
- [ ] Snap To Grid
- [ ] Placeholder
- [ ] Drag Layer
- [ ] 实时 Grid 坐标
- [ ] 限制 Grid X
- [ ] 防止拖出左右边界
- [ ] locked Widget 禁止拖动
- [ ] draggable=false 禁止拖动
- [ ] ESC 取消拖动

---

# 18. Drag Placeholder

拖动过程中：

原位置：

```text
Widget
```

拖动 Widget：

```text
Drag Layer
```

目标位置：

```text
Placeholder
```

Placeholder 显示即将落下的位置。

例如：

```text
┌────┬────┬────┬────┐
│    │████│████│    │
│    │████│████│    │
└────┴────┴────┴────┘
```

---

# 19. Drag Layer

拖动时不要频繁直接移动原 Widget DOM。

推荐：

```text
原 Widget：
opacity 降低

Drag Layer：
transform translate3d(...)
```

拖拽动画使用：

```css
transform
```

避免：

```css
left
top
```

频繁触发布局。

---

# 20. Collision Detection

采用：

**AABB**

Axis-Aligned Bounding Box。

核心函数：

```ts
export function isColliding(
  a: GridRect,
  b: GridRect
): boolean
```

判断：

```ts
a.x < b.x + b.w &&
a.x + a.w > b.x &&
a.y < b.y + b.h &&
a.y + a.h > b.y
```

---

# 21. 获取所有 Collision

实现：

```ts
export function getCollisions(
  target: FlexibleGridItem,
  layout: FlexibleGridItem[]
): FlexibleGridItem[]
```

排除：

```text
target 自己
```

---

# 22. Collision Resolution

Collision Detection 和 Collision Resolution 必须分离。

目录：

```text
collision.ts

collision-resolver.ts
```

---

# 23. Swap

第一版支持：

```text
相同大小 Widget
```

交换位置。

例如：

```text
Before

A B
```

拖动 A 到 B：

```text
After

B A
```

第一阶段规则：

```text
A.w === B.w
A.h === B.h
```

则允许 Swap。

不同大小先不自动交换。

---

# 24. Push

Push 是 Flexible Grid 的重要功能。

例如：

```text
A
B
C
```

C 拖到 A：

```text
C
A
B
```

实现：

- [ ] Vertical Push
- [ ] 被碰撞 Item 向下移动
- [ ] 连锁 Push
- [ ] Push 后继续 Collision Detection
- [ ] 防止无限循环
- [ ] 防止死锁

第一版只实现：

```text
向下 Push
```

暂时不实现：

```text
上下左右智能 Push
```

---

# 25. Reject

如果目标位置无法放置：

```text
reject
```

Widget 返回：

```text
Drag Start Position
```

---

# 26. Resize

Widget 支持 Resize。

第一版至少支持：

```text
右侧
底部
右下角
```

Resize Handle：

```text
right
bottom
bottom-right
```

---

# 27. Resize 逻辑

Resize 过程：

```text
Pointer Down
↓
Resize Start
↓
Pointer Move
↓
Pixel Size
↓
Pixel → Grid Size
↓
Snap
↓
Constraint
↓
Collision Detection
↓
Collision Resolution
↓
Placeholder
↓
Pointer Up
↓
Commit
```

---

# 28. Resize Constraints

支持：

```ts
minW
minH
maxW
maxH
```

例如：

```ts
{
  minW: 1,
  minH: 1,

  maxW: 6,
  maxH: 4
}
```

---

# 29. Allowed Sizes

为以后 Widget 不同尺寸对应不同 UI 做准备。

例如：

```ts
allowedSizes: [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 2, h: 2 },
  { w: 4, h: 2 },
  { w: 4, h: 4 }
]
```

Resize 时只能选择合法 Size。

第一版可以先定义数据结构，但暂时允许连续 Grid Resize。

---

# 30. Auto Placement

新增 Widget 时自动寻找空闲区域。

实现：

```ts
findAvailablePosition(
  layout,
  width,
  height,
  columns
)
```

搜索顺序：

```text
从上到下
每一行从左到右
```

即：

```text
y = 0
  x = 0 -> columns

y = 1
  x = 0 -> columns
```

找到第一个可容纳 Widget 的矩形区域。

---

# 31. 判断区域是否空闲

实现：

```ts
isAreaFree(
  rect,
  layout
)
```

通过 Collision Detection 判断。

---

# 32. Grid 自动向下扩展

Grid 高度不固定。

当新增 Widget 没有空闲位置时：

```text
增加 Row
```

继续搜索。

Grid Width 固定 Columns。

Grid Height 无限向下扩展。

---

# 33. Compaction

Compaction：

```text
自动补位
```

第一版实现：

```text
vertical
```

含义：

Widget 尽可能向上移动。

例如：

```text
Before

A B
. C
D E
```

删除 A。

结果尽量压缩：

```text
D B
. C
. E
```

具体位置由碰撞规则决定。

---

# 34. Vertical Compaction 算法

可以采用：

```text
1. 按 y 排序
2. 同 y 按 x 排序
3. 遍历 Widget
4. 每个 Widget 尝试不断 y--
5. 直到：
   - y == 0
   - 或发生 Collision
6. 保存最后合法位置
```

核心：

```ts
compactVertical(layout)
```

---

# 35. Dock Bar

布局整体结构：

```text
FlexibleGridShell
│
├── DockBar
│
└── GridViewport
```

Dock Bar 可以停靠：

```text
top
bottom
left
right
```

---

# 36. Dock Bar 布局

Top：

```text
┌──────────────────────────────┐
│ Dock Bar                     │
├──────────────────────────────┤
│                              │
│ Flexible Grid                │
│                              │
└──────────────────────────────┘
```

Bottom：

```text
┌──────────────────────────────┐
│                              │
│ Flexible Grid                │
│                              │
├──────────────────────────────┤
│ Dock Bar                     │
└──────────────────────────────┘
```

Left：

```text
┌─────┬────────────────────────┐
│     │                        │
│ D   │                        │
│ O   │ Flexible Grid          │
│ C   │                        │
│ K   │                        │
│     │                        │
└─────┴────────────────────────┘
```

Right：

```text
┌────────────────────────┬─────┐
│                        │     │
│                        │ D   │
│ Flexible Grid          │ O   │
│                        │ C   │
│                        │ K   │
│                        │     │
└────────────────────────┴─────┘
```

---

# 37. Dock Bar 实现要求

不要使用：

```text
position absolute
```

作为主要布局方式。

推荐使用：

```text
CSS Grid
```

或者：

```text
Flex Layout
```

管理 Shell。

Dock Position 改变时，只改变整体 Shell Layout。

---

# 38. Dock Bar 第一版功能

- [ ] Top
- [ ] Bottom
- [ ] Left
- [ ] Right
- [ ] 切换 Dock Position
- [ ] 横向 / 纵向布局自动变化
- [ ] Grid Viewport 自动重新计算尺寸
- [ ] Dock Size 可配置
- [ ] Dock 状态持久化

---

# 39. Dock Bar 内容

第一版可以放：

```text
Flexible Grid

Add Widget

Grid Overlay

Compact

Lock

Undo

Redo

Dock Position
```

建议：

```text
[ Logo ]

[ + ]

[ Grid ]

[ Compact ]

[ Lock ]

--------

[ Undo ]

[ Redo ]

--------

[ Dock ]
```

---

# 40. Edit Mode

建议从第一版就增加：

```text
editing
```

状态。

普通模式：

```text
Widget 可以正常交互内部内容
```

编辑模式：

```text
允许拖拽
允许 Resize
显示 Grid
显示 Handle
```

例如：

```ts
editing: true
```

---

# 41. Widget Lock

Widget 支持：

```ts
locked: boolean
```

locked=true：

```text
禁止 Drag
禁止 Resize
```

但仍可以：

```text
显示
点击
内部交互
```

---

# 42. Global Lock

增加：

```text
Lock Layout
```

全局锁定。

例如：

```ts
editing = false
```

---

# 43. Zustand Store

推荐使用：

```text
Zustand
```

管理 Flexible Grid 状态。

不要让每个 Widget 自己管理：

```text
x
y
w
h
```

这些数据必须统一放在 Store。

---

# 44. Store 建议

```ts
interface FlexibleGridStore {
  state: FlexibleGridState

  addItem(...): void

  removeItem(...): void

  moveItem(...): void

  resizeItem(...): void

  updateItem(...): void

  setDockPosition(...): void

  setCompactMode(...): void

  setCollisionStrategy(...): void

  undo(): void

  redo(): void
}
```

---

# 45. Undo / Redo

Flexible Grid 第一版必须支持：

```text
Undo
Redo
```

操作：

```text
Drag
Resize
Add
Remove
Swap
Push
Dock Position
```

都应该支持撤销。

---

# 46. History Model

推荐：

```ts
interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}
```

操作：

```text
Operation
↓
past.push(present)
↓
present = newState
↓
future = []
```

Undo：

```text
past.pop()
↓
present
↓
future
```

---

# 47. Keyboard Shortcut

第一版：

```text
Ctrl + Z
Undo

Ctrl + Shift + Z
Redo

Delete
Remove Selected Widget

Escape
Cancel Drag / Resize
```

Mac：

```text
Cmd + Z
Cmd + Shift + Z
```

---

# 48. Selection

第一版支持 Widget Selection。

状态：

```ts
selectedItemId?: string
```

点击：

```text
Widget
```

选中。

空白处点击：

```text
clear selection
```

选中 Widget 时可以显示：

```text
Resize Handle
Delete
Lock
```

---

# 49. Layout Persistence

第一版使用：

```text
LocalStorage
```

保存：

```text
Grid Config
Dock State
Items
```

---

# 50. Layout JSON

建议格式：

```json
{
  "version": 1,

  "grid": {
    "columns": 12,
    "rowHeight": 80,
    "gapX": 8,
    "gapY": 8,

    "compactMode": "vertical",
    "collisionStrategy": "push"
  },

  "dock": {
    "position": "top",
    "size": 48,
    "autoHide": false,
    "visible": true
  },

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

      "maxW": 6,
      "maxH": 4,

      "draggable": true,
      "resizable": true,
      "locked": false
    }
  ]
}
```

---

# 51. Persistence Strategy

启动：

```text
LocalStorage 有数据
↓
读取
↓
validate
↓
restore
```

如果没有：

```text
load default demo layout
```

---

# 52. Layout Version

必须保存：

```ts
version: 1
```

未来数据结构改变时支持：

```text
migration
```

例如：

```ts
migrateLayoutV1ToV2()
```

---

# 53. Responsive Viewport

Grid 必须响应容器尺寸变化。

监听：

```text
ResizeObserver
```

不要只监听：

```text
window.resize
```

Grid Metrics 根据实际容器计算。

---

# 54. Columns

第一版默认：

```ts
columns = 12
```

后续可以支持：

```text
8
12
16
24
```

第一版允许通过配置切换。

---

# 55. Layout Rendering

布局建议使用：

```text
absolute positioning
+
transform
```

管理 Widget。

Grid Overlay 可以使用：

```text
CSS Grid
```

但 Widget 本身不建议完全依赖原生 CSS Grid 自动布局。

原因：

Flexible Grid 需要完整控制：

```text
Drag
Collision
Swap
Push
Placeholder
Animation
```

---

# 56. Widget Position Rendering

推荐：

```css
position: absolute;
transform: translate3d(x, y, 0);
width: ...;
height: ...;
```

Grid Engine：

```text
x/y/w/h
```

转换为：

```text
pixel rect
```

---

# 57. Animation

拖拽之外的布局变化：

例如：

```text
Push
Swap
Compaction
```

使用：

```css
transition: transform 150ms ease;
```

拖动中的 Widget 禁止 transition。

否则会产生拖拽延迟感。

---

# 58. Pointer Events

优先使用：

```text
Pointer Events
```

不要分别维护：

```text
mouse
touch
pen
```

使用：

```text
pointerdown
pointermove
pointerup
pointercancel
```

---

# 59. Interaction State

建议：

```ts
type InteractionMode =
  | "idle"
  | "dragging"
  | "resizing"
```

Store 或 Hook 中维护。

---

# 60. Drag State

```ts
interface DragState {
  itemId: string

  startPointerX: number
  startPointerY: number

  startGridX: number
  startGridY: number

  currentGridX: number
  currentGridY: number
}
```

---

# 61. Resize State

```ts
interface ResizeState {
  itemId: string

  startPointerX: number
  startPointerY: number

  startW: number
  startH: number

  currentW: number
  currentH: number
}
```

---

# 62. Layout Transaction

Drag 和 Resize 过程中：

不要每一帧都直接写入最终 Store History。

推荐：

```text
开始操作
↓
创建临时 Layout
↓
交互过程中修改临时 Layout
↓
Pointer Up
↓
Commit
↓
创建一条 History
```

避免拖一次生成几十条 Undo History。

---

# 63. Layout Validation

实现：

```ts
validateLayout(layout)
```

检查：

```text
id 唯一

x >= 0

y >= 0

w >= 1

h >= 1

x + w <= columns

不存在非法重叠

min/max 合法
```

---

# 64. Grid Constraints

Constraint Engine：

```text
core/grid/constraints.ts
```

负责：

```text
Grid Boundary

Widget min/max

allowedSizes

locked

columns
```

---

# 65. 第一阶段开发顺序

严格按以下顺序开发。

---

## Phase 1：基础 Grid

目标：

给定 JSON，可以正确渲染布局。

实现：

- [ ] 项目初始化
- [ ] Grid 数据模型
- [ ] Grid Config
- [ ] Demo Layout
- [ ] Grid Metrics
- [ ] Grid → Pixel
- [ ] Pixel → Grid
- [ ] Grid Overlay
- [ ] Widget Render
- [ ] Responsive Container

完成标准：

```text
修改 JSON 中 x/y/w/h
页面可以正确反映位置和尺寸
```

---

# 66. Phase 2：Drag

目标：

Widget 可以自由拖动。

实现：

- [ ] Pointer Down
- [ ] Pointer Move
- [ ] Pointer Up
- [ ] Snap To Grid
- [ ] Drag Layer
- [ ] Placeholder
- [ ] Drop
- [ ] ESC Cancel
- [ ] Grid Boundary

完成标准：

```text
Widget 可以拖到任意合法 Cell
```

---

# 67. Phase 3：Collision

目标：

Widget 不能非法重叠。

实现：

- [ ] AABB
- [ ] getCollisions
- [ ] Reject
- [ ] Swap
- [ ] Vertical Push
- [ ] Recursive Push

完成标准：

```text
任何 Drag 完成后 Layout 不存在非法重叠
```

---

# 68. Phase 4：Resize

目标：

Widget 可以自由扩缩。

实现：

- [ ] Resize Handle
- [ ] Right Resize
- [ ] Bottom Resize
- [ ] Bottom Right Resize
- [ ] Snap
- [ ] minW/minH
- [ ] maxW/maxH
- [ ] Collision
- [ ] Placeholder

完成标准：

```text
1×1 Widget 可以 Resize 成 2×2 / 4×2 等尺寸
```

---

# 69. Phase 5：Auto Placement

目标：

动态添加 Widget。

实现：

- [ ] Add Widget
- [ ] findAvailablePosition
- [ ] isAreaFree
- [ ] 自动扩展 Rows
- [ ] Remove Widget

完成标准：

```text
新增 Widget 不需要用户指定 x/y
```

---

# 70. Phase 6：Compaction

目标：

删除或移动后自动补空位。

实现：

- [ ] Vertical Compaction
- [ ] Compact on Remove
- [ ] Compact on Drop
- [ ] Compact Toggle

完成标准：

```text
Layout 可以自动减少不必要的纵向空隙
```

---

# 71. Phase 7：Dock Bar

目标：

Flexible Grid 支持四向 Dock。

实现：

- [ ] DockBar
- [ ] Top
- [ ] Bottom
- [ ] Left
- [ ] Right
- [ ] 横纵布局切换
- [ ] Grid 自动 Resize
- [ ] Persist Dock Position

完成标准：

```text
Dock 切换方向后 Grid 自动适配剩余区域
```

---

# 72. Phase 8：编辑能力

实现：

- [ ] Select
- [ ] Editing Mode
- [ ] Widget Lock
- [ ] Global Lock
- [ ] Delete
- [ ] Keyboard Shortcut

---

# 73. Phase 9：Undo / Redo

实现：

- [ ] History
- [ ] Undo
- [ ] Redo
- [ ] Ctrl/Cmd + Z
- [ ] Ctrl/Cmd + Shift + Z

---

# 74. Phase 10：Persistence

实现：

- [ ] LocalStorage
- [ ] Save
- [ ] Restore
- [ ] version
- [ ] validate
- [ ] fallback default layout

---

# 75. 第一版功能范围

Flexible Grid v0.1 必须完成：

```text
Grid Cell System

Grid Item

Add Widget

Remove Widget

Drag

Snap To Grid

Placeholder

Resize

Collision Detection

Swap

Push

Reject

Auto Placement

Vertical Compaction

Widget Lock

Global Layout Lock

Selection

Undo

Redo

LocalStorage

Dock Bar
├── Top
├── Bottom
├── Left
└── Right

Responsive Viewport
```

---

# 76. v0.1 暂不实现

以下功能暂时不要投入时间：

```text
服务端数据库

用户登录

云同步

复杂 Widget 内容

多人协作

移动端完整适配

动画系统高级配置

布局模板市场

Widget 插件系统

Widget SDK

跨 Grid 拖拽

多页面 Grid

嵌套 Grid

Auto Hide Dock

复杂智能碰撞 AI

复杂 Responsive Breakpoint Layout
```

---

# 77. 后续版本预留

后续可以增加：

```text
Nested Grid

Multiple Grid

Cross Grid Drag

Widget Registry

Widget SDK

Layout Template

Responsive Layout

Breakpoint Layout

Mobile Layout

Touch Optimization

Dock Auto Hide

Dock Floating Mode

Context Menu

Copy / Paste Widget

Multi Select

Group Drag

Group Resize

Alignment Guides

Magnetic Snap

Layout Import

Layout Export

Layout Template

Layout Profile

Cloud Sync
```

---

# 78. Responsive Layout 后续设计

未来可以支持：

```ts
layouts: {
  desktop: [],
  tablet: [],
  mobile: []
}
```

或者：

```text
1920+
1440+
1024+
768+
```

不同 Breakpoint 使用独立 Grid Layout。

v0.1 暂不实现。

---

# 79. Widget Size 与 UI 状态

未来允许 Widget 根据 Size 呈现不同 UI。

例如：

```text
1×1
Compact View

2×1
Small View

2×2
Medium View

4×2
Large View

4×4
Extra Large View
```

Widget 可以通过：

```ts
w
h
```

决定自身显示模式。

Flexible Grid 不关心 Widget 内容。

---

# 80. 性能原则

Drag / Resize 时：

避免：

```text
频繁 React 全局 Re-render
```

推荐：

```text
Pointer Move
↓
requestAnimationFrame
↓
更新 Drag Layer
```

真正 Layout Commit：

```text
Pointer Up
```

时执行。

---

# 81. React 性能

需要关注：

```text
memo

useMemo

useCallback

selector-based Zustand subscription
```

Widget 只订阅：

```text
自己的状态
```

避免一个 Widget 移动导致所有 Widget 重新渲染。

---

# 82. Collision 性能

v0.1 可以直接：

```text
O(n)
```

遍历所有 Widget。

如果以后 Widget 数量非常大：

可以增加：

```text
Spatial Hash

Grid Occupancy Map

QuadTree
```

v0.1 不需要提前优化。

---

# 83. Occupancy Map

可以考虑维护：

```ts
Cell[][]
```

或者：

```ts
Map<string, itemId>
```

形式：

```text
"0:0" -> widget1
"1:0" -> widget1
```

但第一版以简单矩形 Collision 为主。

不要提前复杂化。

---

# 84. 测试要求

核心 Grid Engine 必须写单元测试。

测试工具建议使用 Vitest。核心算法测试在 Node 环境执行，确保不依赖 React、DOM 或 Browser API。

重点测试：

```text
collision

placement

compaction

constraints

resize

coordinate conversion
```

---

# 85. Collision Tests

至少覆盖：

```text
完全不相交

边缘接触

部分重叠

完全覆盖

包含关系

同位置

不同大小
```

---

# 86. Placement Tests

覆盖：

```text
空 Grid

第一行有空位

第一行无空位

跨多 Cell Widget

需要增加新 Row
```

---

# 87. Compaction Tests

覆盖：

```text
上方完全空

上方部分空

上方有 Collision

多个 Widget 连续压缩

不同大小 Widget
```

---

# 88. 开发模式信息

建议开发阶段提供 Debug Panel。

显示：

```text
Grid Columns

Cell Width

Row Height

Current Drag Item

Grid X/Y

Current W/H

Collision Item

Compact Mode

Collision Strategy

Dock Position
```

可以极大提高调试效率。

---

# 89. Debug Overlay

开发时支持：

```text
显示 Grid Cell

显示 Cell Coordinate

显示 Widget x/y/w/h

显示 Placeholder

显示 Collision 区域
```

生产版本可以关闭。

---

# 90. 初始默认配置

建议：

```ts
const defaultConfig: GridConfig = {
  columns: 12,

  rowHeight: 80,

  gapX: 8,
  gapY: 8,

  compactMode: "vertical",

  collisionStrategy: "push"
}
```

Dock：

```ts
const defaultDock: DockBarState = {
  position: "top",

  size: 48,

  autoHide: false,

  visible: true
}
```

---

# 91. UI 第一版原则

UI 只需要：

```text
清晰
稳定
方便调试
```

第一版不要投入大量时间做视觉设计。

优先确保：

```text
Grid 行为正确
```

Demo Widget 可以只使用：

```text
名称
尺寸
坐标
简单背景
```

例如：

```text
Widget A

2 × 2

x: 0
y: 0
```

---

# 92. 第一版页面结构

建议：

```text
FlexibleGridShell

┌──────────────────────────────┐
│ Dock Bar                     │
├──────────────────────────────┤
│                              │
│         GridViewport         │
│                              │
│                              │
└──────────────────────────────┘
```

---

# 93. FlexibleGrid Component API

未来目标：

```tsx
<FlexibleGrid
  columns={12}
  rowHeight={80}
  gap={8}
  items={items}
  collisionStrategy="push"
  compactMode="vertical"
  onLayoutChange={handleLayoutChange}
/>
```

---

# 94. Widget Rendering

可以设计：

```tsx
<FlexibleGrid
  items={items}
>
  {(item) => (
    <WidgetRenderer item={item} />
  )}
</FlexibleGrid>
```

或者：

```tsx
<FlexibleGrid
  renderItem={(item) => (
    <WidgetRenderer item={item} />
  )}
/>
```

第一版内部写死 DemoWidget 也可以，但结构上要预留 Renderer。

---

# 95. 核心 API 目标

Grid Engine 最终应该具有类似 API：

```ts
moveItem()

resizeItem()

addItem()

removeItem()

findAvailablePosition()

isColliding()

getCollisions()

resolveCollision()

compactLayout()

validateLayout()
```

---

# 96. 不要这样实现

避免：

```text
所有逻辑全部写在 FlexibleGrid.tsx

Widget 自己维护位置

Widget 自己维护尺寸

拖动时直接修改 DOM left/top

布局数据保存 px

Collision 写死在 React Hook

Dock Bar 使用大量 absolute 定位

每次 pointermove 都写 LocalStorage

每次 pointermove 都增加 Undo History
```

---

# 97. 推荐实现方式

正确方向：

```text
Grid Engine
↓
纯 TypeScript

Interaction
↓
React Hooks

State
↓
Zustand

Render
↓
React Components

Persistence
↓
LocalStorage
```

---

# 98. Flexible Grid 的职责边界

Flexible Grid 负责：

```text
Widget 放哪里

Widget 多大

Widget 能否移动

Widget 能否缩放

Widget 是否碰撞

Widget 碰撞后如何处理

Widget 如何自动补位
```

Flexible Grid 不负责：

```text
Widget 里面显示什么

Widget 业务逻辑

Widget 网络请求

Widget 数据源

Widget 内部 UI
```

---

# 99. 最终 v0.1 验收标准

当以下流程完整可用时：

```text
打开页面

↓

加载 Layout

↓

显示若干不同尺寸 Widget

↓

拖动 Widget

↓

自动吸附 Grid

↓

碰撞其他 Widget

↓

执行 Push / Swap

↓

松开鼠标

↓

Layout 正确

↓

Resize Widget

↓

发生 Collision

↓

自动处理 Collision

↓

删除 Widget

↓

自动补位

↓

新增 Widget

↓

自动寻找位置

↓

Undo

↓

Redo

↓

切换 Dock Bar：
Top
Bottom
Left
Right

↓

Grid 自动 Resize

↓

刷新浏览器

↓

布局完全恢复
```

则：

```text
Flexible Grid v0.1
```

视为完成。

---

# 100. 第一项开发任务

从以下内容开始：

## Task 001

初始化：

```text
Vite
React
TypeScript
Zustand
```

然后建立：

```text
core/grid/types.ts
core/grid/coordinates.ts
components/flexible-grid/FlexibleGrid.tsx
components/flexible-grid/GridItem.tsx
components/flexible-grid/GridOverlay.tsx
```

完成：

```text
12 Columns

80px Row Height

8px Gap

JSON Layout

Grid → Pixel

Widget Render
```

暂时：

```text
不要实现 Drag
不要实现 Resize
不要实现 Collision
```

先确保：

> **任何合法的 x / y / w / h 数据都能够被稳定、准确地渲染。**

这是整个 Flexible Grid 后续所有功能的基础。

