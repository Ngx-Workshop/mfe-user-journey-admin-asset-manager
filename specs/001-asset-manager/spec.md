# Feature: Ngx-Workshop Asset Manager
Status: Implemented; live writes pending · Created/updated: 2026-10-03

## Problem and scope
Administrators need to manage uploader assets instead of example MongoDB documents.
Deliver browsing, searching, filtering, metadata creation/editing, file intake with
progress, details, archive/restore, and confirmed permanent deletion. Binary storage,
preview/download and deployment are outside this remote's contract.

## Requirements and acceptance
- FR-001 / AC-001: List assets with loading, empty, failure/retry states; search names,
  filenames, descriptions and tags; filter archive, media category and storage status.
- FR-002 / AC-002: Create/edit metadata with trimmed required name (120 characters),
  description (2000), at most 50 tags of 100 characters. Clearing description/tags
  persists. Failed saves keep the dialog open with useful feedback.
- FR-003 / AC-003: Receive one nonempty file up to 25 MiB, filename at most 255
  characters, optional name/description; show progress and pending-storage outcome.
  Do not imply durable storage, preview or download availability.
- FR-004 / AC-004: Inspect identifiers, timestamps, original file, media type, size,
  checksum, version and storage status; archive/restore; delete only after confirmation.
- FR-005 / AC-005: Preserve default App, Routes and federation exposures; mount at the
  shell route without redirecting to hello-world; keep legacy deep links working.

## Quality and boundaries
Use standalone OnPush components, signals, typed reactive forms and Material.
Keyboard labeled controls and responsive layouts are required. Service owns data
and authorization. Consume installed @tmdjr/service-uploader-contracts 0.0.7 via
same-origin /api/uploader with credentials. User's manifest/lockfile changes remain.

## Evidence and success criteria
Seed app and hosted shell currently display Example MongoDB Docs. Gateway source
maps /api/uploader to service-uploader. All local acceptance behavior is verified by
focused tests/build and browser inspection; authenticated live integration recorded
separately. No contract supports attaching files to an existing metadata record.
