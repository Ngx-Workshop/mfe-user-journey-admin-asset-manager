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
| Library/state/filters | `src/app/components/asset-manager.component.*` |
| Metadata/file intake | `src/app/components/asset-editor.component.ts` |
| Details/delete confirmation | `src/app/components/asset-details.component.ts` |
| Typed forms/mapping | `src/app/services/asset-form.ts` |
| API/errors/file validation | `src/app/services/asset-api.service.ts` |

Components use OnPush, local signals, computed filters, typed reactive forms and
RxJS subscriptions bound to component lifetime. Material dialogs retain input on
failure and block closing during writes. Local assets change after server success.

## Published contracts
Installed `@tmdjr/service-uploader-contracts` 0.0.7 `components.schemas` supplies
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

Storage status is AWAITING_UPLOAD or PENDING_STORAGE. The service currently
records receipt metadata without durable file storage. No preview/download URL,
replacement upload or file attachment to existing records is part of the contract.

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
