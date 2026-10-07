# Handoff: MVVM quality refactor
Status: Complete
Updated: 2026-10-07
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Tasks: [tasks.md](tasks.md)

## Delivered
- Stateless AssetApiService owns HTTP only; published DTO aliases and pure helpers
  have separate modules. Components no longer import the HTTP service.
- AssetManagerStore is a root singleton and owns cache commits for every operation.
  Signals expose synchronous view state; RxJS handles asynchronous operations.
- Save/upload/folder/detail streams are cold. Details pending state starts on
  subscription and cleans up after cancellation, failure or success. Upload HTTP
  events become typed domain progress/completion events at the state boundary.
- Library presentation takes immutable value view models. Dialog orchestration is
  component-scoped; editor subscriptions retain their own dialog lifetime. Form,
  file, progress and recovery state remains local. Close values cannot mutate cache.
- Extracted card visual and file intake presentation keep HTML/SCSS inline and BEM.
  Manager: 283 → 193 lines; editor: 264 → 223; card: 314 → 242.
  The cohesive card body/actions are a documented small exception to ~230 lines.

## Verification
| Acceptance/check | Result | Evidence |
| --- | --- | --- |
| AC-001 | PASS | Store test creates two managers sharing the root instance; destroying the first preserves its in-flight shared load and cache/filter state. |
| AC-002 | PASS | Store tests verify no requests/pending side effects before subscription; details cancellation, failure, overlap suppression and retry. |
| AC-003 | PASS | Store tests cover metadata/upload/folder success commits and failures; existing editor tests retain file/metadata and reset progress for retries. |
| AC-004 | PASS | `npm run build`; `npm test -- --watch=false --browsers=ChromeHeadless`: 36/36 pass. Production source inspection confirms the store is the sole HTTP service consumer; no external templates/styles. |
| Browser integration | PASS | Authenticated admin shell loads rebuilt local bundle; 15 `ngx-asset-card-visual` elements, search Angular → one result, service-backed details and extracted upload intake verified. |
| Responsive | PASS | 390px library has scroll width 390px; upload dialog width 370.5px; original viewport restored. |
| Patch hygiene | PASS | `git diff --check`. |

Execution host Node 24.9.0; CI still targets Node 22. Two old tests initially failed
because they mocked dialog close results as cache writes. Updated them to assert
that only successful store requests commit, then the full suite passed. A transient
missing type import during upload event extraction was corrected before final checks.

Live checks were read-only; server mutations, duplicate conflicts and recovery use
HTTP mocks. No deployment, commits or dependency changes were made. No data migration
or external repository change is required. Federation exports/routes and API paths,
credentials and payloads remain compatible. Existing shared Material component ID
warnings are outside this refactor.

## Remaining work
None for the local refactor acceptance scope. Publishing and real backend mutation
smoke tests remain separate integration/deployment activities. Cache/filters now persist
for the root injector lifetime, with both collections refreshed when the page mounts.

## Context maintenance
Updated architecture, development, constitution (1.1.0) and feature index to preserve
the requested standards and current ownership model for future work.
