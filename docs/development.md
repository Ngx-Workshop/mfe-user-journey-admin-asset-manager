# Development and verification

## Build toolchain compatibility

Keep `@angular-devkit/build-angular` pinned to `21.2.26` and the npm webpack
override at `5.105.2`. Builder `21.2.28` uses webpack `5.112.0`, whose federation
identifiers break `license-webpack-plugin@4.0.2` with an undefined `trim` error.
Both pins keep one compatible webpack runtime. Keep license extraction enabled;
validate a normal production build and non-empty `3rdpartylicenses.txt` before
removing these pins after an upstream fix.
Regenerate the lockfile with CI's Node 22/npm 10, then verify with `npm ci`;
npm 11 can omit optional peer entries required by npm 10.

Use Node 22, matching CI, and run from this repository root.

| Purpose | Command |
| --- | --- |
| Install pinned dependencies | `npm ci` |
| Angular development server | `npm start` |
| Production watch and CORS bundle server on 4201 | `npm run dev:bundle` |
| Source organization checks | `npm run check:layout` |
| Production federation build | `npm run build` |
| Behavior tests | `npm test -- --watch=false --browsers=ChromeHeadless` |

There is no lint script or end-to-end runner. A static bundle server does not
proxy APIs. For real integration, use the Orchestrator's session-local
`http://localhost:4201/remoteEntry.js` override in the authenticated shell so APIs
remain same-origin. Do not load another remote inside this remote.

## Routed upload verification (2026-11-04)

Node 22.23.3: all 58 ChromeHeadless tests pass, production federation build passes
with a nonempty 29,824-byte license file, and layout/diff checks pass. New mocked
router/HTTP checks cover nested host and standalone URLs, the legacy library entry,
both upload CTAs, selected folder/Root, cancel/success return, progress, busy guard,
disabled drops, validation, duplicate/storage recovery and folder-load retry.
The standalone preview at localhost:4219/upload renders the new panel and its
folder-service error state. At 390 × 844 the document width is 390px, hints wrap
without overlap, and footer actions remain reachable by scrolling/keyboard. Desktop
layout was also inspected. Standalone has no API proxy, so live backend uploads and
authenticated host routing remain unverified. Consumers using Component alone must
mount the exported Routes for the upload URL. See [handoff](../specs/005-routed-upload/handoff.md).

## Test organization

Unit specs live in repository-root `testing/app/features/asset-manager/`, mirroring
`src/app/features/asset-manager/` responsibility folders (`pages/library`, `state`,
`api` and `forms`). `testing/app/app.spec.ts` covers application composition.
Keep new specs in that tree and import application code from `src/app/`.
The Angular test target uses `../testing/**/*.spec.ts` relative to its `src/`
source root; `tsconfig.spec.json` includes that tree. The production TypeScript
configuration includes only `src/`, keeping tests outside application build inputs.
See [source organization](source-organization.md) for placement conventions.

## Checks for changes
Run `npm run check:layout` after file/folder changes and build after
source/template/federation changes. Focused mocked tests cover
API paths/credentials/multipart payloads, limits, explicit clears, search/filter
state, retry, archive failure, deletion confirmation, failed saves and progress.
Inspect host mounting, Material dialogs, required-name validation, empty/error
states and responsive layouts. Separate mocked coverage from live integration;
use disposable data in an approved environment for mutation checks.

## Current verification and limitations

2026-11-01 header/compact-card follow-up: selection controls replace Browse's asset
count in its public header slot. Select all/count share a row; Clear selection is
an underlined native text button below. AssetLibrary owns selection and passes a
value snapshot to the results. Cards are preview-only with hover/focus caption and
ellipsis controls, plus coarse-pointer visibility. Checkbox backgrounds are
transparent and ripple/state-layer halo is disabled. Build/license, layout/diff and
53 tests pass, including header/grid synchronization, batch move regressions,
long-name truncation, compact geometry and keyboard focus. The old unused card
import warnings are resolved. Live desktop/mobile checks cover two selected photos,
header row layout, hover menus/captions, transparent checkboxes and 390px no-overflow
layout. No live records were changed.

2026-11-01 multi-select: labelled photo checkboxes, Select all and Clear selection
support grouped folder drags. Hidden selection is pruned; unchecked-card drags move
only that card. Batch PATCH calls are bounded to four, commit each server success,
retain failed records, and skip successful/same-folder records on retry. Typed
save/move feedback now lives in the action bar. Organize is 290px wide; Browse's
filtered count is right-aligned in its header, including narrow layouts.
Build/license, source layout, diff checks and 51 tests pass. DOM/HTTP tests verify
multi-select payloads, partial failure/retry, Root batches, selection pruning and
notification placement. Live checks verify selection, safe no-op group drag,
filter/select-all/clear behavior and 390px layout with no overflow. Default viewport
and empty selection were restored; no live mutations were performed. Existing
unused card imports still warn. The local static preview was restarted on 4201.

2026-11-01 drag moves and folder menus: asset cards can be dropped onto Root or
named folder nodes. Folder-only PATCH writes are pending-guarded and commit only
server success; error messages retain data and allow retry. Node hover/focus menus
replace folder CTAs; normal Refresh buttons are removed, with error-only retries
retained. Organize matches the available Assets-panel height. Build/license,
layout/diff checks and all 46 ChromeHeadless tests pass, including DOM native drag
sequences through the real manager/store and mocked HTTP, failure/retry and Root
null payloads. Browser checks verify menus, rename prefill (cancelled), unchanged
selection, full-height panels, a no-op drag to All folders and 390px layout with no
overflow. No live write was performed. Existing unused card imports still warn.

2026-11-01 folder workspace: Folders and Assets are sibling inner panels within
Asset library; the filter console no longer contains folders. A Material tree
replaces the folder selector with All folders → Root/named folders. Flat API
contracts and folder mutations are unchanged. Nested bodies fit the parent
workspace; inner panels stack below 1201px. Container breakpoints adapt the
existing dense photo grid. Build/license, layout/diff checks and 43 tests pass.
Live read-only checks cover Root filtering, named-folder actions/rename prefill,
collapse/expand, keyboard selection and 390/1024px layouts without overflow.
Existing unused card imports still warn; unrelated card work was preserved.

2026-10-31 layout follow-up: the asset library now uses the same full-width
console/results workspace as the migrated catalogs. At 1920 × 907, the console
was 320px wide and results panel 1552px; both fit above the viewport bottom and
scroll independently. At 390 × 844, panels stack, Show controls expands the rail,
page width remains 390px and desktop body sizing clears. Search, Root folder
filtering and empty-state reset pass with live reads. Build/layout/diff checks and
all 36 ChromeHeadless tests pass. No live writes were performed.

2026-10-31 design system migration: production build (with nonempty license output),
layout check and all 36 ChromeHeadless behavior tests pass. Shared action bar,
panels, buttons, status components and semantic tokens replace the legacy header
and local visual treatments. Standalone loads ngx.theme(); federated views inherit
the shell theme. The authenticated admin shell loaded the local remote with 22
assets. Search reduced Angular to seven matches; unmatched search showed the empty
state and Reset filters restored the library. Root folder filtering, asset details,
asset action menu, upload/create/folder dialogs and blank-name validation were
checked without live writes. At 390px, page width stayed 390px and the upload
dialog measured 370.5px wide. Desktop viewport and filters were restored.
See [migration handoff](../specs/004-design-system/handoff.md). Historical mutation
limitations below remain; existing mocked tests cover write success and recovery.


2026-10-07 source organization: moved feature code under
`src/app/features/asset-manager/` and mirrored suites under
`testing/app/features/asset-manager/`. Reused the shared source layout checker,
with a local `npm run check:layout` command. Layout check, production build and
all 36 ChromeHeadless tests pass. File-content comparison confirmed that existing
TypeScript content, including uncommitted formatting, was preserved apart from
relative import targets. Public app/federation entries, provider lifetimes and
runtime behavior are unchanged. This structural change did not require a new live
mutation or browser smoke test; historical feature records retain original paths.


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
