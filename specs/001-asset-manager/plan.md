# Implementation plan: Asset Manager
Status: Implemented; live writes pending · Updated: 2026-10-03 · Spec: [spec.md](spec.md)

## Source baseline and design
Seed app, example CRUD services/components, stale scaffold test; existing user
changes add uploader contracts. Replace seed components with asset manager list,
editor and details/confirmation dialogs. API service derives types from published
components schemas and sends JSON or FormData to /api/uploader. Keep HTTP client
at the host boundary; standalone appConfig provides it for local bootstrap.

## Mapping and constitution
FR-001: signals/computed list and local filters in app/components/asset-manager.
FR-002/003: editor dialog, typed form and validation helpers; upload reports events.
FR-004: details and delete confirmation dialogs; pending actions/errors in list.
FR-005: root App and Routes keep exports; empty route directly mounts App and
hello-world aliases it for existing bookmarks. Federation dependencies unchanged.
All six constitution principles satisfied: focused remote, compatible exposures,
Angular/Material, server ownership, behavior tests and local documentation.

## Contracts and delivery
Service-uploader 0.0.7 schemas define AssetDto/CreateAssetDto/UpdateAssetDto.
Upload accepts file/name/description only; metadata create/edit accepts tags.
202 means PENDING_STORAGE, not durable binary storage. No migrations needed.
Shell supplies HttpClient/animations and authenticated same-origin requests.
Gateway configuration already contains /api/uploader; live availability unverified.

## Verification and risks
Build production federation bundle; run mocked HTTP/form/state tests; inspect local
UI and hosted shell when possible. Use no production mutations for verification.
Potential service/auth outage must leave useful retry/error states. No preview or
file-to-existing-record operation invented; these require producer changes.
