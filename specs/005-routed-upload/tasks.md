# Tasks: Routed file upload

Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Updated: 2026-11-04

- [x] T001 — Add routed panel, view model, folder loading, navigation and busy guard (FR-001/002/004/005; AC-001/003/004). Verify routed HTTP tests.
- [x] T002 — Add single-file picker/drop selection and validation; remove dialog upload workflow (FR-003/005; AC-002). Depends on T001. Verify intake tests and metadata recovery tests.
- [x] T003 — Update behavior suites; run full tests, production build/license, layout and diff checks. Depends on T001/T002.
- [x] T004 — Update architecture, development, source map and feature index; record evidence and integration limits in handoff. Depends on T003.

## Progress and evidence

T001/T002: Routed panel, page-local upload view model, folder URL/loading, busy guard,
metadata-only dialog and file-drop input delivered. T003: 58 ChromeHeadless tests,
production federation build, nonempty license, layout and diff checks pass on Node 22.
T004: Architecture, source organization, development and index updated; handoff records
mocked versus standalone/live evidence. No external code changes were required.
