# Implementation plan: Asset Manager
Status: Implemented; live writes pending · Updated: 2026-10-03 · Spec: [spec.md](spec.md)

## Source baseline and design
Seed app, example CRUD services/components, stale scaffold test; existing user
changes add uploader contracts. Replace seed components with asset manager list,
editor and details/confirmation dialogs. API service derives types from published
components schemas and sends JSON or FormData to /api/uploader. Keep HTTP client
at the host boundary; standalone appConfig provides it for local bootstrap.

The manager remains the orchestration component for dialogs and user intentions.
A component-scoped store owns API workflows and private writable signals, exposing
read-only state and explicit mutation methods. Summary, library and card components
are presentational boundaries. The library consumes a single read-only store
contract and derives a computed template view model. It delegates filters and
result states to focused components using cohesive view-model slices and typed
outputs for user intentions. All component templates/styles are inline and
component CSS follows BEM.

## Mapping and constitution
FR-001: signal/computed list and local filters in the component-scoped store;
the manager coordinates dialogs, while summary, library and card presentation
components render state and emit intentions.
FR-002/003: editor dialog, typed form and validation helpers; upload reports events.
FR-004: details and delete confirmation dialogs; pending actions/errors in list.
FR-005: root App and Routes keep exports; empty route directly mounts App and
hello-world aliases it for existing bookmarks. Federation dependencies unchanged.
All six constitution principles satisfied: focused remote, compatible exposures,
Angular/Material, server ownership, behavior tests and local documentation.

## Contracts and delivery
Service-uploader 0.0.8 schemas define AssetDto/CreateAssetDto/UpdateAssetDto.
Upload accepts file/name/description only; metadata create/edit accepts tags.
Uploaded files persist in S3 and AssetDto exposes `storageUrl`; image cards render
that URL as a preview. No migrations needed.
Shell supplies HttpClient/animations and authenticated same-origin requests.
Gateway configuration already contains /api/uploader; live availability unverified.

## Verification and risks
Build production federation bundle; run mocked HTTP/form/state tests; inspect local
UI and hosted shell when possible. Use no production mutations for verification.
Potential service/auth outage must leave useful retry/error states. Preview applies
only to image assets with a returned storage URL; file-to-existing-record operation
requires a producer change.
