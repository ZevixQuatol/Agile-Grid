# Agile Grid / 灵巧网格

基于 Cell 的固定视口分页网格演示应用，验证拖拽、缩放、碰撞挤让、跨页放置与自动排布算法。

每页拥有固定可用宽高，不出现水平或垂直滚动条。布局按从左到右、从上到下排列，放不下的内容进入后续页。

- 产品设计：v1.0，2026-10-05 已冻结。
- 应用框架：Next.js App Router + React + TypeScript。
- 当前进度：Git 与设计基线已准备，下一项为 Task 001 基础分页渲染。
- v1.0 不包含 Widget 锁定和 Undo / Redo。

## 开发入口

1. 阅读 [冻结设计](docs/design-v1.0.md)。
2. 阅读 [需求决策](docs/design-decisions.md)。
3. 按 [开发任务](docs/development-plan.md) 执行 Task 001。

核心布局引擎为纯 TypeScript，与 React、DOM、Next.js 和 Browser API 解耦。Widget 内容和业务逻辑由应用层负责。

## 仓库

远端：`git@github.com:ZevixQuatol/Agile-Grid.git`  
分支：`main`  
设计基线标记：`design-v1.0`

应用初始化、依赖安装与构建尚未执行；运行命令将在 Task 001 落定后提供。

