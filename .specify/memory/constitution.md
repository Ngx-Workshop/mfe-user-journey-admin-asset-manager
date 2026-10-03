# Constitution — Angular remote seed

Version: 1.0.0 · Adopted: 2026-09-29

These are design requirements for future work, not a claim that every inherited
seed implementation already satisfies them. Current gaps live in the development guide.

## 1. One remote, one responsibility

Ngx-Workshop is a learning platform using independently maintained repositories.
A remote owns a focused user journey or a structural element. The host shell
loads and composes remotes. Do not nest remotes or assume ownership of global
navigation, authentication, or other journeys.

## 2. Preserve integration contracts

Treat `remoteEntry.js`, exposed modules, exported symbols, route behavior, shared
singletons, and HTTP contracts as public interfaces. Document compatibility and
consumer impact before changing them. The gateway owns routing from browser API
paths to services; this remote does not choose production service addresses.

## 3. Follow the Angular model already in use

Use standalone components, zoneless-compatible state updates, Angular Material,
typed reactive forms, signals for local state, and RxJS for asynchronous flows.
Prefer focused components and services; use `OnPush` where appropriate. Avoid
introducing another state framework or weakening types without a demonstrated need.
Keep Angular and federation shared versions aligned with the consuming shell.

## 4. Put data ownership on the server

Use published DTO contracts and explicit request mapping. Frontend visibility and
route guards support the user experience; backend authorization remains necessary.
Keep credentials and privileged operations out of browser assets. Do not infer
authorization rules from the seed's demonstration CRUD interface.

## 5. Make behavior observable and verifiable

Specify acceptance scenarios before nontrivial implementation. Cover loading,
empty, success, validation, and failure states appropriate to the feature. Preserve
keyboard access, useful labels, and responsive behavior. Test observable outcomes
and integration boundaries; do not treat a successful build as end-to-end proof.

## 6. Keep knowledge local and current

An agent with this checkout alone must be able to understand its responsibilities,
contracts, and verification steps. Record external dependencies and handoffs in the
feature folder. Distinguish assumptions, source observations, and verified results.

## Amendments

Change these principles intentionally with a rationale and version/date update.
Review affected architecture docs and templates at the same time. A justified
feature-specific exception belongs in its plan, with impact and follow-up stated.
