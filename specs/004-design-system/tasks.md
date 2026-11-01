# Tasks: Design system migration
- [x] T001 — Migrate pages/library chrome, panels, cards, controls and tokens (FR-001–003). Verify build and browser rendering.
- [x] T002 — Add shared overlay classes and standalone theme (FR-003–004). Verify dialogs/selects and mobile fit.
- [x] T003 — Run layout, production build and existing mocked behavior suite (AC-002–004).
- [x] T004 — Inspect host library, search and dialogs at desktop/390px; update context docs and handoff with actual evidence.

## Evidence
T001–T002: source migration complete; shared surfaces and explicit overlay classes
render in the authenticated host. T003: production build, nonempty license output,
layout and 36 behavior tests pass. T004: desktop/390px read-only host checks pass;
see [handoff.md](handoff.md) for outcomes and limits. No external tasks required.

- [x] T005 — Implement rail/results composition and measured panel bodies (FR-005).
- [x] T006 — Verify desktop independent scrolling, 390px stacked flow, filter and
  folder behavior; rerun build/layout/tests and update handoff (AC-005).

T005–T006: full-width rail/results layout implemented, including measured action
bar sizing and mobile controls toggle. Desktop and mobile browser checks,
production build, source layout and 36 tests pass; details in the handoff.

- [x] T007 — Nest Folders/Assets panels in the workspace; fit nested scroll bodies
  and responsive grid (FR-006). Verify desktop/mobile browser checks.
- [x] T008 — Replace folder select with keyboard tree and add observable tests for
  selection, expansion, actions and retry (FR-007). Run focused/full unit suite.
- [x] T009 — Record build/layout/browser evidence and update architecture/handoff.

T007–T009: nested folder/assets panels and keyboard tree delivered; 43 tests,
production build, license output, layout/diff checks and desktop/tablet/mobile
read-only integration checks pass. Details and inherited warnings in the handoff.

- [x] T010 — Add shared source/drop directives and guarded store moves (FR-008).
- [x] T011 — Replace folder CTAs with node menus and fill Organize height (FR-009–010).
- [x] T012 — Verify DOM drag→HTTP outcomes, menu actions, failure/retry, full build/
  suite/layout and desktop/mobile views; update architecture and handoff.

T010–T012: native drag source/drop directives, guarded folder-only moves, per-node
menus and full-height Organize delivered. Build/license, layout/diff and 46 tests
pass; desktop/mobile UI and safe no-op native drag checked. No live writes.

- [x] T013 — Multi-select controls and group drag/drop session (FR-011).
- [x] T014 — Guarded batch moves, partial failure/retry and action-bar feedback (FR-012–013).
- [x] T015 — Wider Organize/right header count, integration tests, responsive checks
  and final documentation/build/test evidence.

T013–T015: visible multi-select and grouped drag/drop, bounded batch moves with
partial retry, typed action-bar feedback, wider Organize and right Browse count
are complete. Build/license, source layout, diff and 51 tests pass. Final live
checks confirm three-photo selection, right-aligned mobile count at 390px without
overflow, and restored empty selection/default viewport. Live records unchanged.

- [x] T016 — Share selection between Browse header and results; two-row link-style controls.
- [x] T017 — Compact hover/focus/touch cards and transparent, ripple-free checkboxes.
- [x] T018 — Update outcome tests and run build/layout/suite and browser verification;
  update architecture and handoff for AC-014–015.

T016–T018: selection header, underlined Clear and compact hover/focus cards complete.
Build/license, layout/diff and all 53 tests pass. Desktop/mobile checks confirm
layout, selection synchronization, hover/menu/keyboard access and no overflow.
No live asset mutations were performed.
