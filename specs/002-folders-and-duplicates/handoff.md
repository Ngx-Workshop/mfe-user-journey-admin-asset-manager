# Handoff: Folders and duplicate upload feedback

Status: Implemented; integration pending
Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Tasks: [tasks.md](tasks.md)
Updated: 2026-10-04

## Delivered behavior

All folders/Root/named-folder browsing combines with existing filters. Folder CRUD
dialogs trim nonblank names, retain input and explain duplicate-name/nonempty
conflicts. Deletion requires confirmation; archived assets are called out.

Create/upload defaults to the selected folder; the editor also moves assets,
including explicit null root moves. Cards/details show folder labels; missing
references are not silently displayed as Root. Stored keys/URLs are not patched.

Duplicate-upload 409 retains the file/metadata and explains cross-folder/archived
duplication. Storage failures permit retry and progress resets on each attempt.

## Acceptance and verification evidence

| Scenario/check | Command or method | Result | Evidence/limitation |
| --- | --- | --- | --- |
| AC-001 through AC-004 | `npm test -- --watch=false --browsers=ChromeHeadless` | PASS | 30 tests; HTTP mocks, not backend mutations |
| Production bundle/types/templates | `npm run build` | PASS | No build or component-style budget failures |
| Desktop/narrow UI | Browser at 1280px/390px with intercepted API data | PASS | Folder label, rename prefill, selected upload destination; no horizontal overflow, 370.5px dialog inside 390px viewport |
| Test tool discovery | Editor test tool | NOT RUN | Tool reported no tests; Angular CLI successfully ran the actual suite |
| X001 authenticated mutations | Live service/gateway | NOT RUN | Requires approved disposable data/authenticated shell |

Standalone browser initially reported API 404s (no local proxy). Mocked checks
substituted fixtures. Alternate-port dev server emitted inherited publicHost/HMR
websocket errors; browser interactions still worked. Temporary server stopped
and browser interception removed after checks.

## Contract and consumer handoff

Consume uploader contracts 0.0.11. Service-uploader must deploy authenticated folder
subpaths and duplicate prevention; gateway must forward /api/uploader/folders.
Upload now documents 201 READY; event handling still tolerates successful 202.
Default App, Routes, federation exposures and shared dependencies are unchanged.
No backend deployment or hash/concurrency verification is implied by local tests.

## Remaining work and next action

T001-T004 complete. The folder save form explicitly cancels native submit navigation
before saving; the focused regression test dispatches a cancelable submit event.
X001 remains: mount the built remote in the authenticated shell
and use approved disposable data to create/rename folders, upload into one, move to
root (confirm unchanged key/URL), reject archived duplicates and nonempty-folder
deletion, and verify a failed storage upload can be retried.

## Context maintenance

Architecture/development and feature index updated for 0.0.11 and actual evidence.
Historical 001 feature records remain as the original implementation snapshot.
