# Tasks: Folders and duplicate upload feedback

Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Updated: 2026-10-04

## Local implementation

- [x] T001 — Add typed folder API and operation-specific errors in
  src/app/services/asset-api.service.ts. FR-002/FR-004. Depends: none.
  Verify authenticated paths and conflict tests.
- [x] T002 — Add folder state/browser/dialog, wire manager, editor, form, and library
  presentation. FR-001/FR-002/FR-003. Depends: T001. Verify filters, destinations,
  null moves, confirmation and failure recovery.
- [x] T003 — Expand API, app and dialog tests. AC-001 through AC-004.
  Depends: T001/T002. Verify ChromeHeadless suite and production build.

## Integration and documentation

- [x] T004 — Update architecture/development/index and handoff. Depends: T003.
  Verify recorded results distinguish mocks from live integration.

## External work

- [ ] X001 — Verify authenticated folder CRUD, moves and duplicate uploads against
  deployed service-uploader through shell/gateway. Blocks live acceptance only.
  Use approved disposable data; confirm URLs/keys remain unchanged and archived
  duplicates/nonempty folders are rejected.

## Progress and evidence

T001-T004 complete: production build passes and 29 ChromeHeadless tests pass on
2026-10-04. Mocked browser checks at 1280px/390px verified folder selection,
rename prefill, intake destination and narrow layout. See [handoff.md](handoff.md).
