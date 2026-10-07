# Implementation plan: MVVM quality refactor
Status: Complete
Updated: 2026-10-07
Baseline: 9b02b59; Angular 21.1.0, RxJS 7.8.2; clean working tree.

## Design
1. Separate DTO models and pure validation/formatting/error helpers from AssetApiService.
2. Make AssetManagerStore providedIn root. Retain readonly signals/computed state;
   add cold save/upload/folder streams with tap-based server-success cache updates.
   Move detail pending acquisition inside defer. Keep lifetime teardown on owned subscriptions.
3. Build library value view models in the store; remove the presentation store contract.
4. Extract component-scoped dialog orchestration into AssetManagerDialogs; route editor
   HTTP operations through the singleton while retaining local forms/file/progress/errors.
5. Extract file intake and card visual presentation; retain inline SCSS/BEM and public selectors.
6. Add singleton/request lifecycle tests; run existing recovery/contract tests and build.
7. Update architecture/development and record evidence in handoff.

## Constitution and compatibility
All six principles satisfied: focused remote, unchanged federation/API contracts,
standalone typed forms and signal/RxJS state, server-authoritative updates, behavioral
checks and local documentation. No migration or other repository work required.

## Risks and verification
Singleton filters/cache persist through navigation intentionally. Dialog subscriptions
remain bound to dialog/component lifetimes. Verify cold streams, cancellation, cache
updates, duplicate/retry progress and existing filters with HTTP testing. Inspect the
host UI after rebuild if its local override consumes this checkout. Separate observed
live behavior from mock mutation coverage. No external Angular API research needed:
use APIs already present and locally installed declarations.
