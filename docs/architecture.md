# Asset Manager architecture
Source reviewed: 2026-10-03.

## Responsibility and source map
This Angular standalone remote owns the administrator asset library. It consumes
service-uploader and does not own shell navigation, authentication, gateway routing
or binary persistence.

| Concern | Source |
| --- | --- |
| Bootstrap / standalone providers | `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts` |
| Federation root | `src/app/app.ts`: named and default `App` |
| Routes | `src/app/app.routes.ts`: named `Routes`, empty path and legacy `hello-world` |
| Library/dialog orchestration | `src/app/components/asset-manager.component.ts` |
| Component-scoped signal state/API workflows | `src/app/components/asset-manager.store.ts` |
| Summary/library composition | `src/app/components/asset-manager-summary.component.ts`, `asset-library.component.ts` |
| Filters/results/card presentation | `src/app/components/asset-library-filters.component.ts`, `asset-library-results.component.ts`, `asset-card.component.ts` |
| Library view-model contracts | `src/app/components/asset-library.models.ts` |
| Filter types/media mapping | `src/app/components/asset-manager.models.ts`, `asset-manager.utils.ts` |
| Metadata/file intake | `src/app/components/asset-editor.component.ts` |
| Details/delete confirmation | `src/app/components/asset-details.component.ts` |
| Typed forms/mapping | `src/app/services/asset-form.ts` |
| API/errors/file validation | `src/app/services/asset-api.service.ts` |

Components use inline templates and styles, OnPush change detection, and BEM class
names. The manager coordinates dialogs and user intentions. Its component-scoped
store encapsulates writable signals, computed filters, API workflows, errors and
pending state while exposing read-only signals. Presentational components receive
the store's read-only signal contract and derive a computed template view model.
The library passes cohesive filter and result view-model slices to focused child
components. They emit typed user intentions without owning or mutating server
state. RxJS subscriptions are bound to the manager lifetime and write into signals.
Material dialogs retain input on failure and block closing during writes. Local
assets change after server success.

## Published contracts
Installed `@tmdjr/service-uploader-contracts` 0.0.8 `components.schemas` supplies
AssetDto, CreateAssetDto and UpdateAssetDto. All calls are same-origin and include
credentials. Service authorization is authoritative.

| Method | Browser path | Payload/result |
| --- | --- | --- |
| GET | `/api/uploader` | AssetDto[] |
| GET | `/api/uploader/:id` | AssetDto |
| POST | `/api/uploader` | CreateAssetDto → AssetDto |
| POST | `/api/uploader/upload` | FormData file/name/description → 202 AssetDto |
| PATCH | `/api/uploader/:id` | UpdateAssetDto → AssetDto |
| PATCH | `/api/uploader/:id/archive` or `/unarchive` | AssetDto |
| DELETE | `/api/uploader/:id` | 204, no body |

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
not part of the contract.

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
The dev bundle server uses port 4201 with CORS. Deployment target remains
`/opt/mfe-remotes/mfe-user-journey-admin-asset-manager/`. Building locally does not
publish the remote. Shell registry and gateway configuration are external owners.
