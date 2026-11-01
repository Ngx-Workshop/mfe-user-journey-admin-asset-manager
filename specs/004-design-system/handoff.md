# Handoff: Design system migration
Status: Complete
Updated: 2026-11-01
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Tasks: [tasks.md](tasks.md)

## Delivered behavior
NgxActionBar replaces the particle banner and solid action strip. Folder and library
workspaces use NgxPanel; actions use NgxButton; storage and library indicators use
NgxInlineStatus. Overview and cards use semantic surfaces, text, borders and state
tokens. Image previews fit the whole artwork. File input has a themed native file
selector. Material keeps form validation, dialogs, selects, menus and focus behavior.
All overlays explicitly use design system classes. The unused legacy header was
removed. Standalone includes the bundled theme; the shell supplies federated styles.

## Acceptance and verification evidence
| Scenario | Method | Result |
| --- | --- | --- |
| AC-001 | Authenticated admin shell using local remote | Shared action bar, two panels, themed buttons and 22 live assets rendered |
| AC-002 | Live read-only smoke | Angular search: seven matches; no-match empty state and reset; Root filtering; details loaded; asset menu and upload/create/folder dialogs rendered; blank name showed validation with Save disabled |
| AC-002 | Existing mocked behavior suite | All 36 ChromeHeadless tests pass, including failed-write recovery and state/HTTP/form contracts |
| AC-003 | 390 × 844 viewport | Page width 390px; upload dialog 370.5px wide, 690.56px tall; controls fit; viewport and filters restored |
| AC-004 | npm run build | Pass; nonempty 3rdpartylicenses.txt |
| AC-004 | npm run check:layout; git diff --check | Pass |

## Contracts and remaining work
No external producer changes, dependency edits, API changes, data migrations,
federation export changes or deployments. The user's existing installation and
federation configuration were retained. Live uploads, edits, archive and deletion
were intentionally not exercised; mutation behavior remains covered with HTTP mocks.
No remaining migration tasks. Broader theme switching and live write integration
remain outside this migration's read-only browser acceptance scope.

## Context maintenance
Architecture now describes the shared presentation and overlay policy. Development
records current verification, and the feature index links this migration.

## Layout follow-up — 2026-10-31
The workspace now follows the orchestrator/navigation catalog composition: full
available width, compact 280–320px left console and an expanding results panel.
Overview metrics, search, visibility/type/storage filters, folder actions and reset
live in the console. Both panel bodies fit the viewport below the measured action
bar and scroll independently. At 900px and below they stack in document flow; Show
controls expands the console. Public panel hosts use height:auto before measuring
content, and observers/listeners are cleaned up on destruction.

Desktop verification at 1920 × 907: console 320px, results panel 1552px; both panels
ran from y=181 to y=891. Each body was 527px tall with independent scroll overflow;
page height stayed 907px. Search found seven Angular assets, Root filtered to one,
and a no-match search showed the empty state with working reset. At 390 × 844,
page width stayed 390px, desktop body heights cleared, Show/Hide controls worked,
and search still returned seven matches. Viewport and filters were restored.
Production build, nonempty license output, source layout, diff whitespace check
and all 36 ChromeHeadless tests pass. The folder selection assertion now targets
the folder browser explicitly because the sidebar presents search filters first.
No live writes or external contract changes were needed.

## Folder workspace follow-up — 2026-11-01
Folder functionality moved out of CONTENT / FILTER. AssetLibrary now contains a
Folders panel and an Assets panel side by side inside asset-library__workspace,
with the requested projection slots and asset results component. Each inner body
fits the outer workspace boundary and scrolls independently when needed. Below
1201px inner panels stack; below 901px the filter console also stacks/collapses.

The folder select is replaced by a Material tree: expandable All folders contains
Root and named folders. The published FolderDto has no parentId, so this is a
virtual browsing hierarchy over the existing flat folder contract. CDK owns arrow,
Enter/Space and typeahead behavior; selected state is exposed with aria-selected.
Stable node keys retain expansion during refresh. Existing create/refresh and
selected-folder rename/delete intentions are preserved. The photo grid retains
its existing dense appearance, reducing columns by available container width;
long filenames no longer force narrow-screen horizontal overflow.

Verification: production build passes with nonempty license output; source layout
and diff checks pass; all 43 ChromeHeadless tests pass. Five focused tree tests
cover pointer/keyboard selection, expansion/refresh retention, actions, loading,
empty named-folder list and failure/retry. An additional manager integration test
asserts the two inner panels, absence of folders in the filter console and tree
selection affecting actual filtered results. Existing server/form/state tests pass.
The pre-existing unused DatePipe/NgxInlineStatus warnings from in-progress card
styling remain; that unrelated styling was preserved.

Authenticated shell checks: All folders showed 22 assets, Root showed one;
named-folder selection exposed management actions, and Rename prefilled documents
(cancelled without saving). Collapse/expand and keyboard ArrowDown/Enter selected
Root correctly. At 390px page width stayed 390px; folder controls remained available
outside the collapsed filter console. At 1024px inner panels stacked and the photo
grid used four columns without horizontal overflow. Desktop inner panels shared
one row and fit within the outer workspace. No live writes were performed.

## Drag moves, node menus and full-height Organize — 2026-11-01
Native asset-card drags now share a page-scoped drag session with the folder tree.
Root/named folders accept moves; valid targets highlight. All folders, same-folder,
external files, stale asset/folder IDs, loading and pending operations do not write.
Only folderId is patched (null for Root), preserving all other metadata and stored
URLs. Server success commits cache changes and announces the destination. Failure
retains the source data, clears pending, and allows another drag to retry. The
existing Edit / move asset action remains the keyboard/touch alternative.

Per-node hover/focus icon menus now own New folder and named-folder Rename/Delete.
Menu actions use the clicked node, not the current filter; icons remain visible
on touch. Normal Refresh CTAs are removed; error-only loading retries remain.
Organize fills the measured available height, matching Assets on desktop, while
stacked mobile panels retain natural document flow. Unrelated card styling and
workspace background/guidance changes were preserved.

Verification: production build with nonempty license output, layout/diff checks,
and all 46 ChromeHeadless tests pass. DOM dragstart/dragover/drop tests use the
actual manager/store with HTTP mocks: valid-target highlight, no-op/All/external
rejection, pending disabled drag, duplicate suppression, precise PATCH payload,
failed-write cache retention, retry, filtered source disappearance on success,
Root null moves and storage URL preservation. Store tests reject stale targets and
missing sources. Menu tests cover node-specific actions without selection changes,
virtual-node restrictions and loading/error retry.

Authenticated browser: 22 assets render as draggable; a native drop onto virtual
All folders performed no move. Named-folder menu opens without changing the All
folders filter; Rename prefilled documents and was cancelled. At 1854 × 907 both
inner panels ran from y=293 to y=820 (527px tall); the Organize body filled its
available height. At 390px, page width remained 390px, normal Refresh buttons were
absent, and Root's actions menu opened by keyboard. Viewport and All folders filter
were restored. Real successful/failed move writes were tested with mocks; live
records were left unchanged. Existing unused DatePipe/NgxInlineStatus card warnings
remain outside this scope. No API, federation, dependency or deployment changes.

## Multi-select, grouped moves and action-bar feedback — 2026-11-01
Each asset has a labelled checkbox, with Select all and Clear selection controls.
Dragging a checked card carries the selected visible group; dragging an unchecked
card replaces selection with that card. Selection is pruned when search/folder/
other filters hide records. The local selection model, toolbar and empty-state
components keep the result renderer near the component-size guideline (223 lines).

Folder drops emit a batch. The store resolves current assets, deduplicates IDs,
skips assets already at the destination, blocks overlapping batches and PATCHes
only folderId with at most four requests concurrently. Successful records commit
independently. Failed records retain their source folder and stay selected when
visible. Retry skips previously successful records. Root uses explicit null.

Save/update/move feedback now appears through NgxSaveFeedback in the action bar,
including progress, accurate moved/failed counts and retry guidance. The result
body no longer repeats notices or move errors. Organize is 40px wider (290px).
Browse's filtered count is in its header, right-aligned on desktop and in a
right-aligned full-width header row in narrow containers. Existing full-height
panels and mobile document flow remain intact.

Verification: production build with nonempty license output, layout/diff checks
and all 51 ChromeHeadless tests pass. New DOM/HTTP integration coverage includes
multi-checkbox group dragging, one success/one failure with action-bar feedback,
retry of only the failed photo, header counts, select-all/clear, pruning hidden
selection and dragging an unchecked photo alone. Store coverage verifies bounded
concurrency, deduplication, same-folder skips, partial failure and retry, plus grouped
Root null payloads. Prior single-move, folder-menu and contract tests still pass.
Read-only live checks selected three photos, dragged onto virtual All folders with
no move, pruned selection through search, used Select all/Clear, and confirmed the
290px Organize and right header count. At 390px there was no horizontal overflow;
mobile checkbox selection worked and idle action-bar height remained unchanged.
No live successful move or update was issued. Existing unused card-import warnings
remain. The static local preview server was restarted for the final build.

## Header selection and compact previews — 2026-11-01
Browse's asset count is replaced by its selection controls. Select all and selected
count share one row, and Clear selection appears below as an underlined native text
button. The strip is removed from the photo body. AssetLibrary owns the local
selection model, passing a read-only value snapshot to Results and receiving typed
selection/drag intentions; the header and photos therefore share one selection.

Cards now consist of previews (178px total height around a 176px visual). Name,
archived badge and tags live in a translucent positioned overlay. Caption and
ellipsis appear on hover or keyboard focus; coarse pointers keep them visible, and
open menus retain the controls. Names still truncate, retain their full accessible
text/title and open details. Checkbox backgrounds are transparent; disableRipple
and public Material state-layer overrides remove halos while retaining native
keyboard focus indication. Selection outlines are flat, with no box shadow.

Production build and license output, source layout/diff checks and all 53 tests
pass. Header tests cover placement, one-row select/count plus second-row underlined
Clear, state synchronization and transparent/no-halo checkbox styling. Card tests
cover preview-only geometry, hidden idle/revealed keyboard controls, details action
and long-name truncation with/without an archived badge. Existing grouped drag,
partial failure/retry, same-folder guards and root payload tests still pass. The
previous unused DatePipe/NgxInlineStatus warnings are resolved by the card cleanup.

Authenticated desktop checks confirmed header selection, active underlined Clear,
caption/menu hover visibility, menu actions and preserved keyboard access. At 390px
the header kept its two-row layout with no horizontal overflow. No live writes were
performed. The default viewport and empty selection were restored after preview.

## Search placement follow-up — 2026-11-01
Moved Search assets from AssetLibraryFilters into the manager template directly
above the projected overview. AssetLibrary projects that field before the summary;
visibility/type/storage filters remain below. Existing store query, reset and
selection-pruning behavior is unchanged. Production build, diff checks and all 53
ChromeHeadless tests pass. No API or dependency changes were needed.
Live verification confirmed one search field above the summary, seven Angular
matches, restored empty query and an unclipped floating label in the console.
