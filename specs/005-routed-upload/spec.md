# Feature: Routed file upload

Status: Complete
Feature ID: 005-routed-upload
Created: 2026-11-04
Updated: 2026-11-04
Request/source: Move Upload a file out of AssetEditorComponent, follow the referenced CreateMfePage layout without a stepper, and support file drops.

## Problem and scope
Administrators need a dedicated upload page with space for file intake and optional metadata. Metadata editing and record creation remain dialogs. Bulk uploads and API changes are out of scope.

## Current behavior
AssetManagerDialogs opens AssetEditorComponent for upload and metadata. File intake only supports a native picker. The exported Routes and standalone bootstrap currently only render the library.

## Functional requirements
- FR-001: Upload entry points navigate to a dedicated upload route and preserve the selected folder (All folders means Root). Direct links load folders independently.
- FR-002: Use a responsive centered glass panel, background, entrance and footer actions, with no stepper.
- FR-003: Accept exactly one file through a keyboard-accessible picker or drag and drop. Reject empty files, files over 25 MiB, long filenames and multiple-file drops with useful errors. Selection alone never submits.
- FR-004: Preserve optional display name/description, progress, duplicate/storage-error recovery and store success commits. Prevent duplicate submissions, file changes and route departures during upload. Cancel and success return to the library.
- FR-005: Preserve App/default and Routes federation exports, metadata dialogs and HTTP contracts.

## Acceptance
- AC-001 (FR-001, FR-005): Both upload entry points navigate under the remote mount with the current folder. Standalone and exported routes support direct upload navigation; Cancel returns to the library.
- AC-002 (FR-002, FR-003): The panel has no stepper; picker and single-file drop select the same file; multiple/invalid files show feedback; keyboard picker remains available.
- AC-003 (FR-004): During upload, progress is visible and selection/navigation are blocked. Conflict retains file and form; retry resets progress; success updates the store and returns.
- AC-004 (FR-001, FR-004): Direct navigation fetches folders; folder load failures expose retry and unavailable destinations are visible.

## Quality and boundaries
Use typed reactive forms, OnPush, signals and lifecycle-managed RxJS. Keep API calls in the existing root store. Verify behavior with mocked HTTP/router tests, production build and source layout checks. Live backend writes are outside local acceptance and must be reported separately.

## Assumptions
One upload per submission matches the existing API. Route URL is upload beneath the remote mount. No new server or host configuration is required for consumers loading Routes; Component-only consumers retain the library but need to mount Routes to support upload navigation.
