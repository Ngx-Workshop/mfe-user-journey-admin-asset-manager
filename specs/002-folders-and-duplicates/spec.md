# Feature: Folders and duplicate upload feedback

Status: Implemented; integration pending
Feature ID: 002-folders-and-duplicates
Created: 2026-10-04
Updated: 2026-10-04
Request/source: Uploader 0.0.11 folder CRUD, asset moves and duplicate prevention.

## Problem and audience

Administrators need flat virtual folders to organize assets and actionable feedback
when identical content is rejected, rather than a generic connectivity error.

## Scope

In scope: folder browsing, creation, rename, confirmed deletion, destination selection
for create/upload/edit, root moves, folder labels, and recoverable conflict feedback.
Out of scope: nested folders, bulk moves, backend hashing/storage changes or deployment.

## Current behavior and evidence

The API service and manager store list all assets; the editor supports metadata and
multipart uploads without folders. Contracts 0.0.11 expose folder DTOs and nullable
asset folderId. Upload now documents 201 READY, not the previous 202 receipt.

## User scenarios and acceptance

- AC-001 / FR-001: Browse All folders, Root and named folders, combined with existing
  filters. Legacy absent folderId is root. Folder-load errors offer retry.
- AC-002 / FR-002: Create and rename a trimmed nonblank folder. A duplicate-name 409
  retains input and explains case-insensitive uniqueness. Delete requires confirmation;
  nonempty-folder 409 explains that archived assets must also be moved/deleted.
- AC-003 / FR-003: Create/upload in the selected folder or root; edit changes folder.
  A root move sends explicit null; upload root omits folderId. Failed writes retain
  input and only server success changes library state. S3 URLs/keys are not changed.
- AC-004 / FR-004: Duplicate upload 409 explains identical content across all folders,
  including archived assets. The file/metadata remain selected and retry stays possible.
  Storage failures explain re-upload; retries reset progress.

## Quality requirements

Use OnPush, typed forms/DTOs, Material labeled keyboard controls and signal state.
Preserve API credentials, federation exports and existing archive/search behavior.

## Data and external boundaries

Service-uploader owns folders, hash uniqueness, authorization and storage. Consume
installed contracts 0.0.11 through same-origin /api/uploader. No migrations here.

## Success criteria

Mocked API/store/dialog acceptance tests and production build pass. Live authenticated
mutations remain an integration check, not implied by mock success.

## Assumptions and unresolved decisions

| ID | Assumption | Impact | Resolution/evidence |
| --- | --- | --- | --- |
| Q-001 | Keep existing all-asset list and filter locally | Preserves summary/filter semantics | Contract list supports all assets |
| Q-002 | All folders defaults new items to root; a named selection defaults there | Predictable intake | Root remains explicitly selectable |
| Q-003 | Edit dialog handles moves as well as metadata | One save/error workflow | Published UpdateAssetDto supports folderId |
