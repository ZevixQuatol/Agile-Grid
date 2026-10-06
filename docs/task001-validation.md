# Task 001 验证报告

日期：2026-10-05

结论：Task 001 基础分页 JSON 渲染完成。完整 v1.0 的拖拽、缩放、碰撞挤让、运行时容量适配和持久化尚未实现。

## 交付内容

- Next.js App Router、strict TypeScript、原生 CSS、scoped Zustand；每个 AgileGrid 实例独立创建状态。
- 纯 TypeScript 的模型、页容量计算、`fitsGrid`、`gridToPixel` 和 `pixelToGrid`。坐标换算保留小数精度；吸附到最近 Cell 原点，越界限制由边界检查负责。
- ResizeObserver 测量容器 content box，有限行列、固定页面、无双向滚动。
- 两页 Demo JSON，10 个 Widget，五种尺寸，页导航和辅助线开关；应用层 Renderer 与网格几何解耦。
- 普通浏览模式；不提供布局编辑操作。

容量公式：`cellWidth = (width - (columns - 1) × gapX) / columns`，不足时归零；`rows = floor((height + gapY) / (rowHeight + gapY))`。多 Cell 的宽高只计算块内部间距，不在页边缘添加额外间距。

## 环境与版本

Windows；Node.js 24.14.0 LTS；通过 `npx --yes pnpm@12.9.1` 执行安装、脚本和构建，未修改全局 Node.js / pnpm。

Next.js 16.3.8、React / React DOM 19.3.0、Zustand 5.0.15、TypeScript 6.0.3、Vitest 5.0.3，均精确固定。类型包为 `@types/node` 24.19.1、`@types/react` / `@types/react-dom` 19.3.0。

npm registry 核对时 TypeScript 最新稳定标签为 7.0.2，但 Next.js 的 TS7 CLI 检查仍标注 experimental；本阶段采用已冻结的 TS6 Compiler API 路径，并显式设置 `experimental.useTypeScriptCli: false`，没有跳过类型检查。参考 [Next.js useTypeScriptCli 文档](https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli)。

## 自动检查

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx --yes pnpm@12.9.1 typecheck` | Next route typegen 与 `tsc --noEmit` 通过 |
| 核心单元测试 | `npx --yes pnpm@12.9.1 test` | 1 个文件，36 项通过；Node 环境，不依赖 DOM |
| 生产构建 | `npx --yes pnpm@12.9.1 build` | Turbopack 编译、TypeScript 检查、静态生成通过 |

测试覆盖：独立横纵 gap、分数 Cell 宽度、整页和首尾 Cell、有限行数的临界高度、零容量、无效参数、矩形越界、坐标往返、最近原点吸附、输入不变性。非有限数值与非法跨度被拒绝；不存在可用 Cell 时禁止坐标换算。

## 实际 Chrome 验证

使用 Playwright CLI 的 `--browser=chrome` 启动实际 Chrome channel（headless），访问本机生产构建服务，未 mock 网格尺寸或浏览器接口。浏览器 UA 报告 Chrome 154.0.0.0。

对每个可显示 Widget，读取 DOM 中的 `x/y/w/h` 与 Demo JSON 比较；使用 `getBoundingClientRect()` 核对左上位置、宽高和页边界。像素误差验收阈值为 0.1px。

| Chrome 视口 | 网格 content box | 页容量 | 验证结果 |
|---|---|---|---|
| 1440×900 | 1390×770 | 12×8 | 两页各 5 个块；像素误差 0；右边界块完整显示 |
| 1280×800 | 1230×670 | 12×7 | 两页完整显示；最大误差约 0.01048px，来自浏览器小数像素量化 |
| 800×600 | 750×470 | 12×5 | 第一页的 4×4 块超出容量，显示空间不足；第二页完整显示 |
| 800×200 | 750×70 | 12×0 | 无可用行，显示空间不足；不渲染 Widget 或辅助 Cell |
| 恢复 1440×900 | 1390×770 | 12×8 | 第二页原有 5 个 ID、坐标和跨度完整恢复；第一页随后重新核对通过 |

其他实际验证：

- 首页上一页禁用、末页下一页禁用；来回翻页可访问全部 10 个块。
- 辅助线关闭后 Cell 数从 96 变为 0，Widget 坐标和尺寸不变；开启后恢复 96 个。
- 每次尺寸验证中，document、body 和网格容器的 `scrollWidth/scrollHeight` 均未超出 `clientWidth/clientHeight`，滚动位置为 0。额外发送横纵滚轮和 PageDown，页面仍未滚动。
- 实际修改源 JSON：将 `app-1` 从第一页移动到第二页并改为 `(x:9,y:6,w:3,h:2)`，重新构建与刷新。第一页显示 4 个块，第二页显示 6 个；该块实际像素为 `(left:1048.5,top:528,width:341.5,height:168)`，全部 10 个 ID 保留。实验后恢复原 JSON，并重新完成最终构建和两页核对。
- 首次浏览器发现缺失 favicon 的 404，添加 App Router 的 `icon.svg` 后重新构建。最终新 Chrome 会话的控制台为 **0 错误、0 警告**；页面、静态脚本、CSS 和图标共 9 个请求均返回 200。

截图与临时 QA 脚本保存在本地 `output/playwright/`，已加入 Git 忽略：

- `task001-page1.png`：最终版本第一页，1440×900。
- `task001-page2.png`：最终版本第二页，1440×900。
- `task001-space-guard.png`：800×600 下第一页的空间不足提示。

## 阶段边界

本次确认的是当前页容量内合法 JSON 的准确渲染。尚未实现自动新页、碰撞或自动缩小；当前页 JSON 超出容量时保留布局数据并显示空间不足。完整的运行时缩小、挤让和跨页适配由 Task 003–005 交付，保持冻结设计不变。

未进行人工 Chrome 操作验收、其他浏览器兼容验证、部署验证或完整 v1.0 验收。

## 2026-10-05：边距与顶栏调整后的验证

按用户要求，主内容四边留白统一为默认 8px，随横纵 gap 配置变化；删除页脚，将网格信息移到顶栏。对应变更记录见 [设计决策](./design-decisions.md)。上面的尺寸表为 Task 001 初次交付时的历史测量，调整后的可用区域如下：

| Chrome 视口 | 当前网格区域 | 当前页容量 |
|---|---|---|
| 1440×900 | 1424×836 | 12×9 |
| 1280×800 | 1264×736 | 12×8 |
| 800×600 | 784×536 | 12×6 |
| 600×800 | 584×736 | 12×8 |
| 375×800 | 359×736 | 12×8 |

- 实际测量主内容与网格的四边距离、辅助 Cell 的横纵间距，均为 8px；页面不存在 footer，信息组位于 header 内。
- 顶栏保持 48px 高度；375px 宽度下标题和分页按钮完整容纳，600px 及以下采用两行紧凑排列。
- 两页 Widget 的实际位置和尺寸仍与 JSON 一致，误差小于 0.1px；信息中的行数随 ResizeObserver 更新，翻页正常。
- 页面、主内容、网格与顶栏均无双向滚动；最终 Chrome 控制台 0 错误、0 警告。
- 重新完成生产构建及其 TypeScript 检查。布局算法未改动，本轮未重跑 36 项核心单元测试。

本地截图：`output/playwright/ui-spacing-page1.png`、`output/playwright/ui-spacing-narrow.png`。

2026-10-05 后续按用户要求去除主内容容器的卡片外观。Chrome 实测 GridViewport 背景为透明，四边 border 为 0px、box-shadow 为 none、圆角为 0px；1424×836 的区域尺寸和 8px 留白保持一致，页面无滚动，顶栏正常，控制台 0 错误、0 警告。生产构建及其类型检查通过；截图为 `output/playwright/ui-no-container-card.png`。

## 2026-10-06：Task 002 拖拽交互验证

- 类型检查：`rtk proxy npx --yes pnpm@12.9.1 typecheck` 通过。
- 核心测试：`rtk proxy npx --yes pnpm@12.9.1 test` 通过，2 个测试文件、40 项测试通过；新增 store 测试覆盖遮挡保持合法预览和编辑模式删除边界。
- 生产构建：`rtk proxy npx --yes pnpm@12.9.1 build` 通过，Next.js 16.3.8 静态生成完成。
- Chrome 生产页面：在 `http://127.0.0.1:3101/` 验证编辑模式显示每个块左上角 `−` 删除按钮；删除 `app-1` 后本页块数由 5 变 4；合法拖拽将 `app-1` 移至 `(x:8,y:6)`；拖向 `small-1` 的占用位置后仍保持 `(x:0,y:0)`，未产生遮挡；控制台无错误或警告。
- 真实拖拽中的中间帧未保存为截图；代码路径已由 `preview` 坐标驱动渲染，静态检查和完成态 Chrome 行为均通过。不同浏览器及部署环境未验证。
- 落点预览：拖拽期间在临时 Widget 位置绘制虚线预览框，合法状态为绿色，遮挡状态为红色；预览框不拦截 Pointer 事件。
