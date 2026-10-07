# Asset Manager architecture
Source reviewed: 2026-10-07.

## Responsibility and source map
This Angular standalone remote owns the administrator asset library. It consumes
service-uploader and does not own shell navigation, authentication, gateway routing
or binary persistence.

| Concern | Source |
| --- | --- |
| Bootstrap / standalone providers | `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts` |
| Federation root | `src/app/app.ts`: named and default `App` |
| Routes | `src/app/app.routes.ts`: named `Routes`, empty path and legacy `hello-world` |
| Page/dialog orchestration | `src/app/components/asset-manager.component.ts`, `asset-manager-dialogs.ts` |
| Root singleton state/view models/API workflows | `src/app/components/asset-manager.store.ts` |
| Summary/library composition | `src/app/components/asset-manager-summary.component.ts`, `asset-library.component.ts` |
| Filters/results/card presentation | `src/app/components/asset-library-filters.component.ts`, `asset-library-results.component.ts`, `asset-card.component.ts` |
| Library view-model contracts | `src/app/components/asset-library.models.ts` |
| Folder browsing and create/rename/delete dialogs | `src/app/components/asset-folder-browser.component.ts`, `asset-folder-editor.component.ts` |
| Filter types/media mapping | `src/app/components/asset-manager.models.ts`, `asset-manager.utils.ts` |
| Metadata/file intake | `src/app/components/asset-editor.component.ts`, `asset-file-input.component.ts` |
| Details/delete confirmation | `src/app/components/asset-details.component.ts` |
| Typed forms/mapping | `src/app/services/asset-form.ts` |
| Stateless HTTP transport | `src/app/services/asset-api.service.ts` |
| Published DTO aliases / pure validation, errors, formatting | `src/app/services/asset.models.ts`, `asset-utils.ts` |

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
with the page lifetime. Editors are orchestration components: they own typed forms,
file selection and local busy/error/progress signals, call store operations and bind
subscriptions to their dialog lifetime. File intake is a presentation child. Editors
retain input on failure and block closing during writes. Dialog close values no longer
commit data: state is already updated by the store before the successful dialog closes.

Cache and filters persist through page navigation for the root injector lifetime;
mounting the manager refreshes both collections. No persistence is added across
reloads. This remote's singleton belongs to the host root injector when federated.
Component sizes are 39–242 lines; the 242-line card is a deliberate small exception
to the approximate 230-line guideline to keep its cohesive actions/body together.

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

Folders are flat and virtual. The store loads folders independently of assets,
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
Local `src/styles.scss` provides a standalone Material theme; component CSS uses
host Material tokens. No Angular or federation shared versions changed.

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
