# AGENTS.md

## Global instructions

@C:\Users\MaoEr\.codex\RTK.md
@C:\Users\MaoEr\.codex\MEMORY.md

Apply the user's default communication preference from C:/Users/MaoEr/.codex/skills/i-have-adhd/SKILL.md unless they request normal mode. Higher-priority instructions still apply.

## Project baseline

- Product: Agile Grid / 灵巧网格.
- Read docs/design-v1.0.md and docs/design-decisions.md before implementation.
- docs/design-v1.0.md is the frozen v1.0 design; use docs/development-plan.md for task order.
- Task progress and the next task are tracked in docs/development-plan.md; validation reports record completed checks.
- Use Next.js App Router, React, strict TypeScript, Zustand and plain CSS; prefer latest compatible stable versions and pin actual dependencies.
- Keep core/grid pure TypeScript, independent of React, DOM, Next.js and Browser API.
- Every grid page has finite columns and rows and a fixed viewport. No horizontal or vertical scrolling.
- Placement proceeds left to right, top to bottom, then to later pages.
- Do not implement Widget locking, Undo / Redo, an independent Global Lock, infinite vertical layout or a separate Swap strategy.
- Only editing mode permits user layout edits. Runtime viewport adaptation is separate from user editing.
- Keep Widget content out of the engine.
- Preserve all Widget ids across collision, pagination, reflow and persistence.

## Scope and verification

- Implement tasks in order. Task 001 must not include Drag, Resize, collision or persistence.
- Any feature or behavior change to the frozen baseline requires a user request and a recorded design change.
- Keep core tests in test/grid and execute them in Node.
- Report type checks, tests, build and actual Chrome verification separately.
- Avoid premature abstractions, spatial indexes, performance frameworks and blank future modules.
- Stage only task-owned files. Make scoped local commits after appropriate verification.
- Do not push, publish or deploy without user authorization.
