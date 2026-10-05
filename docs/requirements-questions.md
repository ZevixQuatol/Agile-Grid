# Flexible Grid v0.1 需求确认

日期：2026-10-05

状态：待用户回复。下列推荐均为讨论建议，尚未成为实现约定。
依据：[startup-v0.1.md](./startup-v0.1.md)。

## 已明确的需求

- Web 原型采用 Vite + React + TypeScript；工具尽量采用最新兼容稳定版。
- Cell 是布局单位，持久化保存整数网格坐标与跨度；像素只用于渲染和交互换算。
- Grid Engine 位于 `core/grid/`，纯 TypeScript，核心布局算法自主实现，与 React、DOM 和浏览器能力解耦。
- v0.1 包含拖拽、吸附、Resize、Push / Swap / Reject、自动放置、纵向补位、锁定、选择、Undo / Redo、LocalStorage、四向 Dock 和容器响应。
- 宽度基于 columns，rowHeight 可配置，内容高度向下扩展；响应容器变化使用 ResizeObserver。
- 一次 Drag / Resize 使用临时布局，松开后作为一个事务提交；取消应恢复整个事务开始前的状态。
- 第一版使用简单 Demo Widget，Widget 内容与业务逻辑不属于网格系统职责。
- 遵循 Phase 1–10 开发顺序；Task 001 先完成准确渲染，不提前实现拖拽、Resize 和碰撞。

## 第一组：交付与布局行为

1. **v0.1 的交付形态是什么？**  
   原文的组件 API 标为未来目标。当前是可运行的演示应用，还是同时需要可供其他项目引入的组件 / npm 包？  
   推荐：先交付演示应用，内部保留清晰的 Grid Engine 与 Renderer 边界，正式发包放到后续版本。

2. **锁定 Widget 是否必须保持位置和尺寸？**  
   第 41 节只明确禁止主动 Drag / Resize，没有定义能否被 Push、Swap、Compaction 移动，也没有定义能否删除。`draggable=false` 是否仅限制主动拖动？  
   推荐：`locked=true` 作为固定障碍，禁止布局算法移动以及直接删除，需先解锁；`draggable=false` 只禁止主动拖动，仍可被布局算法移动。

3. **自动补位能否改变用户刚刚拖放的位置？**  
   第 66 节要求拖到任意合法 Cell，第 70 节要求 Drop 后自动补位，第 90 节默认开启 vertical。若拖到 y=5 且上方有空位，补位可能让它立即上移。  
   推荐：vertical 开启时，拖动项也参与补位；Placeholder 预览最终补位位置，`none` 模式允许保留空白。

4. **Swap 的触发、失败回退及 Resize 碰撞规则是什么？**  
   同尺寸交换已明确；但部分重叠、同时碰到多个块、目标锁定，以及 Resize 使用 swap 策略时的行为未定义。  
   推荐：Drag 仅在单一同尺寸可移动目标上交换，两个项互换起始坐标并验证整份布局；无法合法交换则 Reject。Resize 在 push 模式向下推挤，在 swap / reject 模式拒绝碰撞，不交换。

5. **减少 columns 时如何处理越界项？**  
   第 54 节允许切换列数，但现有 `x+w` 或 `w` 可能超过新列数，也可能与锁定项或 minW 冲突。  
   推荐：新列数下不合法时拒绝切换并提示原因；v0.1 不自动改变 Widget 尺寸或重排整份布局。

## 第二组：交互与状态

6. **向下扩展的 Grid 使用哪一层滚动，拖到边缘是否自动滚动？**  
   第 32 节明确高度向下扩展，四向 Dock 需要与可滚动内容协调。  
   推荐：Shell 占满视口，Dock 保持可见，由 GridViewport 纵向滚动；编辑时拖拽到上下边缘支持自动滚动。若自动滚动不属于 v0.1，可先支持手动滚动。

7. **编辑模式从哪个区域开始拖动？**  
   整块 Widget 拖动可能影响内部按钮、输入框及文本选择。  
   推荐：使用标题栏 / 拖拽手柄启动 Drag；Widget 内容区继续允许正常交互。

8. **Global Lock 禁止哪些操作？**  
   原文以 `editing=false` 表示全局锁定，但没有完整列出 Add、Remove、Compact、Lock、改配置、Undo / Redo、Dock 的权限。  
   推荐：普通模式禁止布局编辑操作，包括 Add / Remove / Drag / Resize / Compact、修改 Widget 锁定和网格参数、Undo / Redo；保留 Widget 内部交互和 Dock 位置切换。

9. **哪些额外操作进入 Undo / Redo，保留多少条历史？**  
   原文已经明确 Drag、Resize、Add、Remove、Swap、Push、Dock Position 可撤销；Widget Lock、columns、CompactMode、CollisionStrategy 等尚未明确。  
   推荐：影响布局、布局约束或 Dock 的变更均可撤销；Selection、编辑模式和调试 Overlay 不进入历史；历史最多 100 次，刷新后清空。

10. **allowedSizes 在 v0.1 是否强制生效？**  
    第 29 节一方面要求 Resize 只能选合法尺寸，另一方面允许第一版只定义数据结构；第 64 节又将它列为约束职责。  
    推荐：v0.1 预留字段，不启用离散尺寸限制；仅按整数 Cell、min / max 和边界约束 Resize。

## 第三组：恢复与验收

11. **刷新后是否恢复编辑模式、选中项和 Undo 历史？**  
    第 49–50 节只列出 Grid Config、Dock State、Items，而第 99 节要求“布局完全恢复”。  
    推荐：恢复 version / grid / dock / items；以普通模式启动，无选中项，Undo / Redo 历史不跨刷新；保存已提交状态，不保存拖拽临时状态。

12. **v0.1 的验收浏览器与性能规模是什么？**  
    原文要求避免频繁全局渲染、支持任意数量 Widget，但没有可测的数量和浏览器范围。  
    推荐：以桌面版最新稳定 Chrome / Edge 为首轮验收环境，100 个 Demo Widget 作为交互测试规模；如果需要 Firefox / Safari 或数百、数千项，请明确纳入目标。移动端完整适配继续按原文放到后续版本。

## 工程建议

- pnpm、原生 CSS、官方 Vite React 插件与 Vitest，具体版本见启动文档。
- 初始化前重新核对最新兼容稳定版本，固定实际依赖和锁文件。
- 核心算法单元测试与浏览器真实交互验证分别提供证据。
- 当前仅审阅和修订文档，未安装依赖、初始化应用或开始 Task 001。

用户回复后，将已确认规则写回启动文档，再开展开发。

