# Feature: MVVM quality refactor
Status: Complete
Created: 2026-10-07

## Problem and scope
The administrator library has a component-scoped store, direct HTTP calls in dialogs,
store-shaped presentation inputs and oversized components. Refactor this remote only.

## Requirements
- FR-001: Stateless HTTP access remains separate from root singleton state; all component data operations use the state layer.
- FR-002: Presentation consumes immutable value view models and emits intentions. Orchestration owns dialog/lifecycle coordination.
- FR-003: Inline HTML/SCSS, BEM classes, OnPush and focused components around 230 lines.
- FR-004: Preserve published DTOs, federation exports/routes, validation, filters, progress, errors and server-success updates.

## Acceptance
- AC-001: Multiple manager instances share singleton state; destroying a manager does not destroy shared state.
- AC-002: Request creation is lazy; pending flags clean up on success, error and cancellation; failures retain cached data.
- AC-003: Save/upload/folder flows update shared state only after success and retain dialog input on failure.
- AC-004: Existing behavior tests and production build pass; presentation has no service/store dependency.

## Boundaries and assumptions
No backend, deployment or dependency changes. Signals represent synchronous view state;
RxJS represents asynchronous operations. Live page inspected with 15 active assets.
Live destructive writes are outside verification scope; HTTP mocks cover mutations.
