# Asset Manager architecture
Source reviewed: 2026-11-04.

## Responsibility and source map
This Angular standalone remote owns the administrator asset library. It consumes
service-uploader and does not own shell navigation, authentication, gateway routing
or binary persistence.

| Concern | Source |
| --- | --- |
| Bootstrap / standalone providers | `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts` |
| Federation root | `src/app/app.ts`: named and default `App` |
| Routes | `src/app/app.routes.ts`: named `Routes`, library at empty path / legacy `hello-world`, and `upload` |
| Page/dialog orchestration | `src/app/features/asset-manager/pages/library/asset-manager.component.ts`, `asset-manager-dialogs.ts` |
| Mirrored feature tests / app composition | `testing/app/features/asset-manager/`, `testing/app/app.spec.ts` |
| Root singleton state/view models/API workflows | `src/app/features/asset-manager/state/asset-manager.store.ts` |
| Library workspace/rail composition | `src/app/features/asset-manager/pages/library/asset-manager-summary.component.ts`, `asset-library.component.ts` |
| Filters/results/card presentation | `src/app/features/asset-manager/pages/library/asset-library-filters.component.ts`, `asset-library-results.component.ts`, `asset-card.component.ts` |
| Visible selection state and controls | `src/app/features/asset-manager/pages/library/asset-library-selection.ts`, `asset-selection-toolbar.component.ts` |
| Empty library/filter results | `src/app/features/asset-manager/pages/library/asset-library-empty.component.ts` |
| Library page view-model contracts | `src/app/features/asset-manager/pages/library/asset-library.models.ts` |
| Folder browsing and create/rename/delete dialogs | `src/app/features/asset-manager/pages/library/asset-folder-browser.component.ts`, `asset-folder-editor.component.ts` |
| Shared command/filter types | `src/app/features/asset-manager/models/asset-manager.models.ts` |
| Pure media mapping | `src/app/features/asset-manager/utils/asset-manager.utils.ts` |
| Metadata editor | `src/app/features/asset-manager/pages/library/asset-editor.component.ts` |
| Routed upload and file intake | `src/app/features/asset-manager/pages/upload/asset-upload-page.ts`, `asset-upload-view-model.ts`, `asset-file-input.component.ts` |
| Details/delete confirmation | `src/app/features/asset-manager/pages/library/asset-details.component.ts` |
| Typed forms/mapping | `src/app/features/asset-manager/forms/asset-form.ts` |
| Stateless HTTP transport | `src/app/features/asset-manager/api/asset-api.service.ts` |
| Published DTO aliases | `src/app/features/asset-manager/models/asset.models.ts` |
| Pure validation, errors, formatting | `src/app/features/asset-manager/utils/asset-utils.ts` |

The feature root is `src/app/features/asset-manager/`. Page-only views and dialog
coordination live in `pages/library/`; API, state, models, forms and pure utilities
have their own responsibility folders. See [source organization](source-organization.md).

## MVVM and data flow

Components use inline HTML/SCSS, OnPush change detection and BEM classes.
The data flow is orchestration → singleton state → stateless HTTP transport.
Published DTO aliases are in `asset.models.ts`; pure helpers live in `asset-utils.ts`.
`AssetApiService` injects only HttpClient and owns no signals or cached data.
Only `AssetManagerStore` consumes that service in production source.

The root-provided store owns the shared asset/folder cache, read-only signal selectors,
filters, notices and pending state. Its computed `libraryViewModel` provides ordinary
value slices to library presentation, filters and results; presentation does not receive
a store or signal-shaped facade. Summary and folder browser also receive values and
emit typed intentions. Card previews live in `asset-card-visual.component.ts`, with
projected card actions retaining parent ownership of the Material menu.

RxJS models asynchronous operations. Save, folder-write, upload and details streams
are cold; subscribing starts their requests. Only successful server responses commit
cache changes. Upload maps HTTP events into domain progress/completion events before
exposing them to the editor. Details acquires its pending flag within `defer` and
clears it on success, error or cancellation. Refresh/archive/delete subscriptions are
owned by the root store; page destruction does not terminate shared operations.

`AssetManagerComponent` coordinates the page and delegates dialog work to its
component-scoped `AssetManagerDialogs`. Details and confirmation subscriptions end
with the page lifetime. Metadata editors own typed forms and local busy/error signals, call store operations and bind
subscriptions to their dialog lifetime. Upload orchestration lives in the page-scoped
AssetUploadViewModel. Its file intake child emits File intentions from either the native
picker or a single-file drop. Both workflows retain input on failure and block departure
during writes. Dialog close values no longer
commit data: state is already updated by the store before the successful dialog closes.

Cache and filters persist through page navigation for the root injector lifetime;
mounting the manager refreshes both collections. No persistence is added across
reloads. This remote's singleton belongs to the host root injector when federated.
The library composition is a documented size exception (about 320 lines): it keeps
the requested outer and inner panels, projection slots and four body measurements
in one view. Folder browsing remains a focused presentation child. Other
presentational components remain focused; the metadata editor is below the
approximate 230-line guideline.

## Published contracts
Installed `@tmdjr/service-uploader-contracts` 0.0.11 `components.schemas` supplies
asset and folder DTOs. All calls are same-origin and include
credentials. Service authorization is authoritative.

| Method | Browser path | Payload/result |
| --- | --- | --- |
| GET | `/api/uploader` | AssetDto[] |
| GET | `/api/uploader/:id` | AssetDto |
| POST | `/api/uploader` | CreateAssetDto → AssetDto |
| POST | `/api/uploader/upload` | FormData file/name/description/folderId → 201 READY AssetDto |
| PATCH | `/api/uploader/:id` | UpdateAssetDto → AssetDto |
| PATCH | `/api/uploader/:id/archive` or `/unarchive` | AssetDto |
| DELETE | `/api/uploader/:id` | 204, no body |
| GET | `/api/uploader/folders` | FolderDto[] |
| POST | `/api/uploader/folders` | CreateFolderDto → FolderDto |
| PATCH | `/api/uploader/folders/:id` | UpdateFolderDto → FolderDto |
| DELETE | `/api/uploader/folders/:id` | 204, no body |

Folders are flat and virtual. The browser presents an expandable Material tree
with virtual All folders as its top node and Root/named folders as children;
these visual levels do not add server-side parent relationships. Pointer and CDK
keyboard activation emit the existing folder filter values. Hover/focus node icon
menus provide New folder and named-folder Rename/Delete; opening a menu does not
select that node. On touch the icons stay visible. Error-only Retry loading folders
remains; normal Refresh CTAs have been removed. The store loads folders independently of assets,
with separate loading/error/retry state, and combines All folders/Root/named-folder
selection with existing local filters. New records/uploads default to the selected
folder (All folders defaults to Root). The asset editor handles moves and metadata:
JSON sends explicit `folderId: null` for root; multipart omits root folderId.
Absent/null folderId is root for legacy records. Cards and details show folder names;
unresolved references show an unavailable-folder label with ID. Stored keys/URLs are
never patched. Summaries remain library-wide, not restricted to the selected folder.

Folder dialogs retain input on failure and apply only server-success results.
Folder names are trimmed and nonblank; the server enforces case-insensitive
uniqueness (409). Confirmed deletion of nonempty folders returns actionable 409
feedback, including archived assets. Upload 409 explains content duplication across
all folders and archived assets, keeps the chosen file/metadata and permits recovery.
Storage failure (503) asks to retry upload; progress resets on each attempt. The
server owns hashing, concurrency protection and failed-upload retryability.

Names are trimmed, required for records, max 120 characters; descriptions max
2000; tags max 50 with 100 characters each. Updates explicitly send blank
descriptions and empty tags to clear them. Files must be nonempty, at most 25
MiB, filename max 255 characters. Multipart fields omit blank optional metadata.
Upload does not accept tags; use Edit metadata after receipt to add tags.

The service stores uploaded files in S3 and provides `storageUrl` for the stored
object. Image cards display that URL as a preview when it is present. The UI
supports PENDING_STORAGE, READY and STORAGE_FAILED status filtering; legacy
AWAITING_UPLOAD records display as storage unavailable but are not offered as a
new filter state. Replacement upload and file attachment to an existing record are
not part of the contract. The current upload contract returns 201 after storage;
the UI still accepts successful 202 responses and displays returned storage state.

## Host and gateway integration
Federation name `mfe-user-journey-admin-asset-manager`, entry `remoteEntry.js`,
`./Component` and `./Routes` exposures are preserved. The shell mounts the remote
at `/admin-asset-manager`, supplies HttpClient and Material animation providers,
and owns global theming. Standalone appConfig is not executed by component loading.
Local `src/styles.scss` includes the installed design system theme as a standalone
fallback. Federated components inherit the shell’s design tokens and Material
policy. NgxActionBar replaces the particle header and legacy action strip; NgxPanel,
NgxButton and NgxInlineStatus supply the shared workspace surfaces and status
presentation. AssetLibrary composes a 280–320px console beside an expanding results
panel across the full available width. The manager projects the Search assets field followed by the compact overview
into that console. Search binds directly to the store query; the remaining filter
component owns visibility, file type and storage controls. Folder controls and
guidance are projected into the nested Folders panel beside a nested Assets panel
inside the main asset-library__workspace panel. Action bar height is measured;
`pages/library/asset-panel-viewport.ts` fits owned panel bodies below the shell and
action bar, with observer cleanup at destruction. Console and workspace bodies fit the viewport on desktop; nested folder and asset
bodies use the workspace boundary for their own scroll areas. Below 1201px the
inner panels stack in document flow. At 900px and below the outer panels also
stack, and the filter console can be expanded with Show controls. Cards retain Material menus; metadata and folder editors retain Material forms/dialogs.
Upload uses a centered stepped glass NgxPanel with viewport background, entrance
animation and projected footer actions, without a stepper.
Dialogs, menus and selects explicitly opt into the shared overlay classes.
No Angular or federation shared versions changed.

Gateway must forward `/api/uploader` to service-native `/uploader`. The platform
configuration includes this mapping. The local production bundle was consumed by
the authenticated admin shell using the existing localhost:4201 override, and
GET returned an empty asset library on 2026-10-03. Live writes were not exercised.

## Build/deployment
Build output: `dist/mfe-user-journey-admin-asset-manager`. Node 22 matches CI.
The deployment workflow runs on pushes to `main` and can also be started manually.
The dev bundle server uses port 4201 with CORS. Deployment target remains
`/opt/mfe-remotes/mfe-user-journey-admin-asset-manager/`. Building locally does not
publish the remote. Shell registry and gateway configuration are external owners.

## Drag-to-folder moves
`pages/library/asset-drag-drop.ts` owns the page-scoped AssetDragSession and source/
destination directives. Manager provides the session so projected folder nodes and
result cards share transient drag state. It never resolves serialized external
payloads as assets. Source teardown and dragend clear the session; valid targets
show a highlight. All folders is virtual and cannot receive a drop.

Folder nodes emit AssetBatchMove (assetIds, folderId), which the manager passes to
the root store. moveAssets resolves canonical state, deduplicates IDs, rejects
stale/loading/busy batches and skips assets already at the destination. Folder-only
PATCH requests run with a maximum concurrency of four (null for Root). Each server
success commits independently; failures retain their cache entries. All batch IDs
are pending before requests start, and a moving selector blocks another group drag.
The single-asset moveAsset method remains a wrapper for existing callers.

AssetLibrary owns AssetLibrarySelection for checkbox/select-all/clear state, scoped
to the current filtered result set. The Browse header controls use that model;
Results receives an ordinary AssetSelectionViewModel snapshot and emits selection/
drag intentions rather than receiving writable signals. Hidden assets are pruned; dragging a selected card
carries all selected visible assets, while an unselected card replaces selection.
Failed visible records remain selected for retry; already successful records are
skipped if the same group is retried. Presentation stays focused through separate
selection-toolbar and empty-state children.

Typed AssetFeedback feeds the shared NgxSaveFeedback in the action bar. Update/save
successes, moving status and complete/partial failure summaries appear there, with
no duplicate result-body notices. Loading/list errors keep their local recovery.
Browse's public panel-header slot contains Select all and selected count on one
row, with a native underlined Clear selection action below. Narrow containers use
a full-width, right-aligned header group. Organize is 290px wide on
desktop (40px wider than before) and retains its full available panel height.
Operations survive page destruction through the root store lifecycle. Native drag
is complemented by the existing Edit / move asset form for keyboard and touch use.
The Organize body uses its measured height, matching the sibling Assets panel.
The cohesive folder tree/menu component is a small documented size exception
(about 280 lines) to keep node actions and selection together.

## Compact preview cards
Cards no longer reserve space for a separate name/footer body. Names, archived
badges and tags are positioned in a translucent preview overlay; the details name
button and ellipsis trigger reveal on hover/focus and remain visible on coarse
pointers. Open menus keep their card controls visible. Accessible labels and full
name text remain in the DOM; long names still truncate visually. Photo checkboxes
have transparent host backgrounds, disabled ripple and zero state-layer opacity
through public Material overrides; keyboard focus indicators remain available.
The former unused DatePipe/NgxInlineStatus imports and inactive card markup were
removed as part of this presentation change.

## Routed uploads
`upload` is relative to the remote mount (normally `/admin-asset-manager/upload`).
Both library upload entry points navigate relative to the mounted library route's
parent; `folderId` is an optional query parameter. All folders/Root omit the parameter.
Direct entry refreshes folders, exposes retry on failure and preserves unavailable
folder IDs visibly until the user changes the destination. Upload success commits
through the existing store before returning to the library; Cancel also returns.
An in-flight upload disables form/file/actions, rejects duplicate submission, blocks
route deactivation and requests browser unload protection. Once idle, leaving is
allowed without an unsaved-input prompt.

The default/named App exposure remains the library. Standalone bootstrap now owns a
router outlet and provides the same exported Routes used by the host. Consumers
mounting only `./Component` must mount `./Routes` to support the upload URL; this
checkout does not alter host registration. Native file drops are confined to the
upload zone and remain separate from library asset-to-folder moves. Multiple-file
drops are rejected, and the existing 25 MiB/nonempty/filename limits apply equally
to picker and drop selection. No upload starts until form submission. Backend
contracts, shared dependency versions and API ownership are unchanged.
