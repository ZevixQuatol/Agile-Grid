# Task 008：编辑权限与快捷键验证

日期：2026-10-08。对应 [开发计划](./development-plan.md) Task 008。

## 实现

- 编辑模式中点击或 Tab 聚焦 Widget 可选中，Delete 复用现有删除与补位逻辑；Escape 取消当前 Drag / Resize 并清除选择，保持编辑模式。切页清除旧选择，普通模式不产生布局选择。
- 输入框、textarea、select、contenteditable、文本输入角色、IME 组合事件、重复按键、修饰键及打开的原生 Popover 保留自身按键行为；键盘入口统一在 Shell，不再重复监听全局 Escape。
- 编辑期间 Widget 内容使用原生 inert 隔离；系统删除按钮与 Resize 手柄仍可用。Store 拒绝普通模式、错误页、关闭对应操作的 Widget、非法容量以及并行 Drag / Resize。
- 主指针左键启动 Pointer Capture，其他指针不更新 / 提交 / 取消当前事务。丢失捕获、pointercancel、切页、退出编辑和容量变化取消整个预览。
- 渲染 DOM 按稳定 id 顺序排列。碰撞解析会把操作块移到数组末尾，原先由 React 调整 DOM 次序会触发 Chrome 丢失 Pointer Capture；稳定 DOM 顺序保留捕获，显示坐标仍来自布局引擎。

## 自动检查

- `rtk pnpm test`：4 个文件、72 项测试通过。新增检查覆盖普通模式全部布局入口、单项 draggable / resizable 与非法容量、切页选择清除、事务互斥及退出编辑后取消预览；关闭主动操作不阻止容量适配分页。
- `rtk pnpm typecheck`：通过。
- `rtk pnpm build`：生产构建通过。

## 真实 Chrome

Playwright CLI 使用 `--browser chrome --headed`，在 1280×800 的生产预览 `http://127.0.0.1:3100/` 检查：

- 普通模式拖动与 Delete 不改变布局，不显示删除、缩放手柄、落点预览或布局选中状态。
- 键盘聚焦选中后 Delete 删除指定 Widget；遍历全部页后确认只少了被删除 ID，其他 9 个 ID 保留。Escape 清除选择，空白点击同样清除选择，编辑模式保持开启。
- 拖拽实际取得 Pointer Capture，移动后有预览与碰撞挤让；活动 Drag 中 Delete 无效，Escape 恢复完整原布局，另一轮 Pointer Up 正常提交。
- Resize 实际取得 Pointer Capture，放大后按 Escape 恢复全部块的位置与尺寸。
- pointercancel、实际 releasePointerCapture 后的丢失捕获事件、切页、退出编辑以及视口宽度变化分别取消预览；再松开指针不提交取消前的结果。
- 原生输入框、textarea、select、contenteditable 中 Delete / Escape 不操作 Widget；输入框 Delete 仍删除自身字符。合成 IME、229、repeat 和修饰键事件不触发布局删除。Dock 厚度控件中 Delete 不删除块，Escape 关闭菜单且不顺带清除 Widget 选择。
- 右键不启动 Drag；退出编辑后移除系统编辑入口，内容的 inert 解除。最终所有可见矩形均在视口内、无重叠，页面与网格无横纵滚动；控制台 0 错误、0 警告。

内容与输入验证使用真实 Chrome 中临时注入到现有内容包装层 / Shell 的原生按钮和输入探针，验证后删除；这些不是发布的 Demo Widget 功能。IME 检查使用合成键盘事件，不代表人工输入法专项验收。

浏览器产物：可复跑脚本 `output/playwright/task008-check.js`，截图 `output/playwright/task008-complete.png`，按仓库约定忽略。本报告只确认 Task 008；持久化与完整 v1.0 验收仍待后续任务。
