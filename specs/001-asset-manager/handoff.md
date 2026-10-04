# Handoff: Ngx-Workshop Asset Manager
Status: Implemented; live writes pending
Updated: 2026-10-03 · [Spec](spec.md) · [Plan](plan.md) · [Tasks](tasks.md)

## Delivered behavior
Replaced the example-document UI and services with a responsive Material asset
library. Supports search/filtering, overview counts, metadata create/edit and
explicit clears, file upload/progress, current server details, archive/restore,
and confirmed permanent deletion. Errors preserve entered input and server-owned
state, with retry and session guidance. Uploaded image cards preview the
`storageUrl` supplied by the service. Published uploader 0.0.8 schema types define
requests/results.

AssetManagerComponent now coordinates dialogs and user intentions. Its
component-scoped AssetManagerStore owns API workflows, private writable signals,
read-only selectors and computed state. OnPush summary, library and card components
are presentational. The library receives one read-only store contract, derives its
computed template view model, and delegates cohesive filter and result slices to
focused child components. All components emit typed outputs, use inline
templates/styles, and follow BEM.

Default/named App and named Routes exports remain compatible. Base route opens
the library and hello-world is a legacy alias. No dependency/federation versions,
backend code or shell configuration changed. User's pre-existing package.json and
package-lock.json edits were preserved. No commit, push or deployment performed.

## Verification evidence
| Scenario/check | Actual method | Result/limit |
| --- | --- | --- |
| AC-001 | ChromeHeadless list/filter/retry tests | PASS; mock responses |
| AC-002 | form and editor failure/retry tests; live blank-name dialog check | PASS; no live save |
| AC-003 | multipart, limits, upload events and image-preview rendering tests | PASS; mock responses |
| AC-004 | API lifecycle and archive/delete confirmation tests | PASS; live mutations pending |
| AC-005 | production build; local bundle consumed through admin shell | PASS; base route and legacy hello-world mount new library |
| Full unit suite | npm test -- --watch=false --browsers=ChromeHeadless | 16 tests passed |
| Production build | npm run build | PASS; no component-style budget warning |
| Live gateway/read | https://admin.ngx-workshop.io/admin-asset-manager | PASS; empty asset library, no HTTP error |
| Responsive/dialog UX | Browser inspection at narrow and desktop widths; metadata/upload dialogs | PASS; host theme used; empty library only |
| Whitespace | git diff --check | PASS |

Observed shell warnings about duplicate Material component IDs come from existing
shared-package subpath configuration. Dialogs opened correctly in this check.
A transient chunk-load error occurred while build output was being replaced;
reloading after build completed resolved it.

## Contract and remaining integration
service-uploader/gateway already expose the consumed route and installed contract.
Uploader persists files in S3 and AssetDto `storageUrl` enables image previews;
direct file access depends on storage permissions. Upload endpoint does not accept
tags; use Edit metadata after receipt. Attaching uploads to existing records remains
outside this feature.

X001 remaining: exercise create/edit/upload/archive/restore/delete against
explicit disposable data in a test environment, including a populated library.
Read-only shell integration is verified using the existing localhost:4201 override;
the production deployment has not been changed. Stop/restart ownership of the
pre-existing dev server remains with the user.

## Context maintenance
README, AGENTS entry description, architecture, development, feature index and
this feature's artifacts describe the adopted asset manager and actual results.
Constitution/template workflow remain applicable without changes.
