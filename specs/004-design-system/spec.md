# Feature: Design system migration
Status: Complete
Feature ID: 004-design-system
Created: 2026-10-31
Request: Migrate Asset Manager to the installed design system like the admin shell and navigation catalog.

## Problem and scope
Administrators need a consistent themed workspace. Migrate the library, overview, actions, cards, folders and dialogs. Preserve asset management behavior, HTTP contracts, exports and federation configuration. No deployment or live data mutations are required.

## Requirements and acceptance
- FR-001 / AC-001: Opening the library presents shared action bar, panels, buttons and semantic design tokens instead of the legacy particle header and Material-only surfaces.
- FR-002 / AC-002: Search, folder/type/storage/visibility filters, details and editor dialogs retain existing behavior; loading, errors, empty results and failed writes remain recoverable.
- FR-003 / AC-003: Desktop and 390px layouts fit the viewport; forms, dialogs and menus retain accessible labels and keyboard behavior, with shared overlay treatment.
- FR-004 / AC-004: Standalone uses the bundled design system theme; federation uses the shell theme. Production build, layout and existing behavior tests pass.

## Boundaries and assumptions
Installed design system 21.0.10 is authoritative. Follow the existing migrated admin patterns while keeping Material interaction primitives. Server data and permission rules are unchanged. Browser validation uses the user-provided authenticated shell and local remote; writes are tested with mocks.

## Layout follow-up
- FR-005 / AC-005: Match the migrated catalog layout: full-width workspace with a
  compact left console and expanding results panel, both fitted below the measured
  action bar. Results and console scroll independently on desktop. At 900px and
  below, stack the console above results without horizontal overflow or fixed
  desktop heights. The console is expandable on mobile. Preserve filters, folder management and empty/error recovery.

## Folder workspace follow-up — 2026-11-01
- FR-006 / AC-006: Move folder browsing/actions out of CONTENT / FILTER into a
  Folders panel beside a separate Assets panel, both inside asset-library__workspace.
  Stack inner panels when space is limited. Keep scrolling, loading/error recovery,
  root/all/named-folder filtering and create/rename/delete intentions intact.
- FR-007 / AC-007: Replace Browse folder select with an accessible keyboard tree,
  expandable All folders → Root and named folders, with selected state. The published
  FolderDto has no parent reference: do not invent nested storage relationships.
  Add outcome tests for pointer/keyboard selection, expansion and management actions.

## Drag moves and folder menus — 2026-11-01
- FR-008 / AC-008: Drag an asset onto Root or a named tree folder to persist a move
  using a folderId-only update. Highlight valid destinations; ignore All folders,
  same-folder, external-file, missing/stale and busy asset drops. Commit only server
  success, retain cached data on failure, announce outcome and permit retry.
- FR-009 / AC-009: Per-node hover/focus/touch-accessible icon menus own folder
  creation and named-folder rename/delete. Opening a menu must not change selection.
  Remove normal Refresh CTAs while retaining error-specific retry.
- FR-010 / AC-010: Organize fills its available desktop workspace height, with a
  scrollable body; mobile panels retain natural flow. Preserve Edit / move asset
  as the accessible alternative to dragging. No new API or storage URL changes.

## Multi-select and action-bar feedback — 2026-11-01
- FR-011 / AC-011: Select several visible assets with keyboard-accessible checkboxes,
  select-all and clear controls. Dragging a selected card carries that group;
  dragging an unselected card selects/moves only that card. Prune hidden selection
  when filters/folders change so invisible assets never move unexpectedly.
- FR-012 / AC-012: Group drops update folderId per asset, skip assets already at the
  destination, guard busy/invalid/stale targets, and preserve failed records. Report
  successes/partial failures accurately; retry must not repeat successful moves.
- FR-013 / AC-013: Save/update/move notifications live in the action bar. Organize is
  slightly wider; the filtered asset count appears at the right of Browse's header.
  Preserve full-height panels, responsive layouts and all existing mutation contracts.

## Header selection and compact cards — 2026-11-01
- FR-014 / AC-014: Replace Browse's asset count with selection controls: Select all
  and selected count on one row, Clear selection on a second row as an underlined
  text button. Header/grid share selection; preserve batch drag/retry and pruning.
- FR-015 / AC-015: Cards consist of their previews, with names/tags in a transparent
  overlay and ellipsis actions revealed on hover/focus. Keep controls available on
  touch. Selection checkboxes have transparent backgrounds and no ripple/halo.
  Preserve keyboard labels, details/menu actions, long-name truncation and selection.
