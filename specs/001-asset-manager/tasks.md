# Tasks: Asset Manager
Updated: 2026-10-03 · [Spec](spec.md) · [Plan](plan.md)

- [x] T001: Add typed API and validation helpers (FR-002/003/004); verify HTTP and validation tests.
- [x] T002: Replace seed with list, filters, editor/details/delete dialogs (FR-001–004); verify state tests and UI.
- [x] T003: Preserve federation exports and mount routes (FR-005); verify production build.
- [x] T004: Update README/context and handoff with actual verification.
- [x] T005: Refactor components to inline templates/styles, BEM CSS, signal-based
  orchestration, encapsulated component-scoped state and typed presentational
  boundaries; split library filters/results into focused components; verify tests
  and build.
- [x] T006: Render `storageUrl` previews for image cards and update storage-state
  messaging/filtering for durable uploads (FR-003/004); verify component rendering
  through the library test and production build.
- [ ] X001: Verify new bundle in authenticated shell against deployed uploader. Owner:
  mfe-shell-admin/service-uploader; no production writes during verification.

## Evidence
T001–T003 and T005: 16 ChromeHeadless tests and production build passed; authenticated
shell loads localhost bundle, empty library and dialogs verified at narrow and
desktop widths before the structural refactor. T004: context docs updated; full
results in handoff. X001 now
requires live mutation checks with disposable test data; read-only host passed.
