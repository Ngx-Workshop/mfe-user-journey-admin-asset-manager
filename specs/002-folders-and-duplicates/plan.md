# Implementation plan: Folders and duplicate upload feedback

Status: Implemented; integration pending
Spec: [spec.md](spec.md)
Updated: 2026-10-04

## Source baseline

Existing component-scoped AssetManagerStore, AssetApiService, editor and library
presentation; user-updated manifest/lockfile for contracts 0.0.11 are preserved.

## Design and requirement mapping

| Requirement | Approach | Files/boundaries affected |
| --- | --- | --- |
| FR-001 | Independent folder loading/error state, local combined filtering, toolbar | store, manager, folder browser |
| FR-002 | Typed CRUD API and failure-preserving write/confirmation dialog | API service, folder editor |
| FR-003 | Folder control with explicit null mapping; labels in cards/details | asset form/editor, library models/results/card, manager |
| FR-004 | Context-specific errors for conflicts and upload failure; reset progress | API error helper, editor |

## Constitution check

One remote and server ownership preserved. DTOs, routes, exports and shared versions
unchanged. Angular typed forms/signals/Material used. Tests cover observable requests,
failure recovery and filtering. Context updated locally; no deviations.

## Data, API, and integration contracts

Authenticated GET/POST /api/uploader/folders, PATCH/DELETE /folders/:id.
Create/update consume published DTOs; create/edit use nullable folderId, multipart
omits root. Folder 409 is operation-specific; upload 409 is global duplicate content.
Upload 201 READY is documented, with existing event handling accepting 202 too.

## External dependencies and delivery order

Service-uploader must deploy folder and duplicate behavior before consumer use;
gateway must forward folder subpaths. Installed 0.0.11 is the type source. Local
HTTP mocks verify requests, but do not verify deployed routing or S3 behavior.

## Verification plan

API tests cover CRUD paths/credentials, multipart destination and null root moves.
Store/app tests cover folder filtering/reset, load failure/retry and state updates.
Dialog tests cover conflicts, retry/input retention and upload progress reset.
Run production build and ChromeHeadless tests per development guide.

## Risks and migration

Concurrent folder removal/missing destination surfaces a 404 asking to refresh.
Nonempty deletion is decided by the server, including archived assets, not a local
count. Unresolved folder references display their ID rather than silently as root.
