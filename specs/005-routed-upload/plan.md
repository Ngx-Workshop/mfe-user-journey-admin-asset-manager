# Implementation plan: Routed file upload

Status: Complete
Spec: [spec.md](spec.md)
Updated: 2026-11-04

## Source baseline
Angular 21.1.0 and design system 21.0.10. Existing editor combines two workflows; standalone bootstrap has no router. Working tree was clean.

## Design and requirement mapping
- FR-001/005: Add upload sibling to app.routes.ts, retain App as the library component exposure and bootstrap a standalone router outlet. Navigate relative to the remote route parent, carrying folderId in the URL.
- FR-002/004: Add pages/upload/asset-upload-page.ts and a local view model, using existing form factory and store. Busy guard prevents in-flight route departures; progress and retry remain local. Load/retry folders on direct entry.
- FR-003: Move file intake into the upload page folder; emit File values from both picker and drop, reject multi-file selections, and retain native keyboard selection.
- FR-005: Simplify AssetEditorComponent to metadata only. Existing API and shared state lifetimes remain intact.

## Constitution check
Single responsibility, federation symbols, server ownership, typed Angular/MVVM and local documentation remain satisfied. No new dependency or API change. Presentation emits file intentions; view model owns async upload state and form orchestration.

## Verification
Meaningful mocked tests cover navigation under a nested mount, direct route entry, cancel, busy guard, picker/drop validation, multipart destination, error retention/retry and completion. Run check:layout, full ChromeHeadless suite, production build, license output and git diff --check. Live shell/backend writes are separate unverified integration checks.

## Risks and migration
Routes consumers gain upload; Component-only consumers must use Routes for navigation. Optional folderId is treated as an opaque identifier and never silently changed to Root if unavailable. No data migration, deployment or external repository edits are required.
