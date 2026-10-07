# Development and verification
Use Node 22, matching CI, and run from this repository root.

| Purpose | Command |
| --- | --- |
| Install pinned dependencies | `npm ci` |
| Angular development server | `npm start` |
| Production watch and CORS bundle server on 4201 | `npm run dev:bundle` |
| Production federation build | `npm run build` |
| Behavior tests | `npm test -- --watch=false --browsers=ChromeHeadless` |

There is no lint script or end-to-end runner. A static bundle server does not
proxy APIs. For real integration, use the Orchestrator's session-local
`http://localhost:4201/remoteEntry.js` override in the authenticated shell so APIs
remain same-origin. Do not load another remote inside this remote.

## Checks for changes
Run build after source/template/federation changes. Focused mocked tests cover
API paths/credentials/multipart payloads, limits, explicit clears, search/filter
state, retry, archive failure, deletion confirmation, failed saves and progress.
Inspect host mounting, Material dialogs, required-name validation, empty/error
states and responsive layouts. Separate mocked coverage from live integration;
use disposable data in an approved environment for mutation checks.

## Current verification and limitations

2026-10-07: MVVM refactor production build and 36 ChromeHeadless tests pass
(Node 24.9.0 on this execution host; CI remains Node 22). Six new store tests cover
shared root-injector lifetime, in-flight refresh survival after page destruction,
lazy details/save/upload/folder streams, details cancellation and overlapping-request
suppression, domain upload progress, failed-write cache retention and server-success
commits. Existing mocked contract, filtering, validation and dialog recovery tests pass.
Two manager tests were updated because dialog close values no longer write cached
state; successful store requests now own those commits.

The authenticated admin shell consumed the rebuilt localhost bundle: 15 extracted
card visual elements rendered, searching Angular returned one asset, details loaded
from the service, and the upload dialog rendered the extracted file input. At a
390px viewport the upload dialog measured 370.5px and the library had no horizontal
overflow (page width 390px). Restored the original viewport, cleared search and closed
the dialog. No live writes were performed; mutations remain verified through HTTP
mocks. Known shared Material component ID warnings remain an external integration
limitation. No lint command or E2E runner was introduced.

Refactor design and evidence: [MVVM refactor](../specs/003-mvvm-refactor/handoff.md).

2026-10-04: folder management and duplicate-upload feedback production build and
30 ChromeHeadless tests pass. Mocked API/dialog/store tests cover folder CRUD,
case-insensitive-name and nonempty-folder conflicts, root/destination mapping,
combined filters, duplicate file retention, retry progress reset and 201 storage
success. Desktop (1280px) and narrow (390px) browser checks used mocked API data:
folder labels, rename prefill and selected-folder upload work; no horizontal
overflow and the upload dialog fits the narrow viewport.
The local dev server on an alternate port reports the inherited webpack
publicHost/HMR websocket mismatch; standalone APIs have no proxy. Neither is live
gateway verification. No authenticated folder mutations or duplicate uploads were
run against the backend.

2026-10-03: production build and 16 ChromeHeadless tests pass (execution host
Node 24.9.0). Component styles remain below the configured warning budget after
the orchestration/presentation refactor.
Authenticated shell consumed the local bundle, returned an empty library, and
rendered dialogs and blank-name validation. Narrow and desktop layouts inspected.
Live mutations and a library containing real assets were not exercised.

Uploader persists uploaded files in S3. The library previews image assets using
the contract's `storageUrl`; direct stored-file access depends on object
permissions. Replacement uploads and attaching a file to an existing record remain
producer-owned work. The shell console also reports inherited Angular Material
component ID collisions across
remote bundles; observed dialogs work, but shared subpath alignment is external
integration work if those warnings become disruptive.

Feature decisions and handoff: [Asset Manager](../specs/001-asset-manager/handoff.md).
Folder/duplicate follow-up: [Folders and duplicates](../specs/002-folders-and-duplicates/handoff.md).
