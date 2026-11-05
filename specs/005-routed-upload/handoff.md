# Handoff: Routed file upload

Status: Complete
Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Tasks: [tasks.md](tasks.md)
Updated: 2026-11-04

## Delivered behavior
Upload CTAs now navigate to `upload` below the remote mount. A centered glass panel
follows the supplied CreateMfePage pattern with background, entrance and footer
actions; the short form has no stepper. Folder selection travels in `folderId`.
Direct links refresh folders and offer retry/unavailable-folder feedback. A native
picker and highlighted drop zone accept one file, with existing validation. Dropping
does not submit. Upload retains progress, file/metadata on errors and retry. Busy
state blocks duplicate submissions, selection, route departures and browser unload.
Cancel and successful completion return to the library. Metadata editing remains a
dialog, and existing folder drag/move behavior is preserved.

## Acceptance and verification evidence

| Scenario/check | Method | Result | Evidence/limitation |
| --- | --- | --- | --- |
| AC-001 | RouterTestingHarness under admin/assets and standalone routes | PASS | Both CTAs, selected destination/Root, legacy route and cancel/success return |
| AC-002 | Real File/DataTransfer/native change events in ChromeHeadless | PASS | Drop highlight, multiple/empty/oversize/long-name validation, picker and no auto-submit |
| AC-003 | Mocked multipart HTTP events and route navigation | PASS | Progress, busy guard, blocked selection/submission, conflict/storage retention, retry and store commit |
| AC-004 | Mocked direct-entry folder load/failure/retry | PASS | Unavailable ID retained; retry replaces error with folders |
| Full suite | npm test -- --watch=false --browsers=ChromeHeadless, Node 22.23.3 | PASS | 58 tests |
| Build | npm run build, Node 22.23.3 | PASS | Normal production federation build; license file 29,824 bytes |
| Structure/whitespace | npm run check:layout; git diff --check | PASS | No layout or whitespace errors |
| Browser preview | Standalone localhost:4219/upload | PASS | Desktop and 390 × 844; width 390px, wrapped hints, reachable actions; visible folder-service failure recovery |
| Live backend/host | Authenticated shell and upload | NOT RUN | Standalone has no API proxy; no live writes or deployment performed |

## Contract and consumer handoff
No DTO, API, federation export or dependency changes. App/default remains the library;
Routes adds upload. Standalone bootstrap supplies a router outlet using those routes.
Host consumers mounting only ./Component need to mount ./Routes for the upload URL.
No external repository was changed. Native library folder moves are separate from
external file intake. The current uploader API remains one file per request.

## Remaining work and next action
Local acceptance is complete. After deployment, smoke-test the authenticated host's
upload route, folder query parameter, actual backend receipt and return navigation.
This integration check is outside the local acceptance scope and is not claimed here.

## Context maintenance
Updated architecture source map/route and upload ownership, development verification,
source organization and feature index. Historical feature records remain unchanged.
