# Implementation plan: Design system migration
Status: Complete
Spec: [spec.md](spec.md)

## Source baseline and mapping
The library currently uses a particle header, Material-only buttons and local rounded surfaces. The installed design system exposes NgxActionBar, NgxPanel, NgxButton, NgxInlineStatus and semantic theme tokens.
- FR-001: Replace page header/action chrome with NgxActionBar; use panels for library/folders and shared button directives throughout pages/library.
- FR-002: Leave store, API, DTOs, forms and event bindings intact. Use status components for storage and feedback.
- FR-003: Keep responsive grids; apply explicit select/menu/dialog overlay classes and semantic surface, text, border and state tokens.
- FR-004: Replace standalone Material theme with ngx.theme(); run build, layout and ChromeHeadless suite, then inspect the authenticated shell on desktop and mobile.

## Constitution and contracts
All principles satisfied: standalone/OnPush and MVVM remain; Angular Material supplies accessible interactions; root state and RxJS lifetimes stay intact. The design system is an intentional replacement of local visual styling. No API, data, provider, federation or dependency changes are planned. No other repository changes are required.

## Risks and delivery
Check sticky action placement under the host header, long filenames, nested panel widths, overlay theming and mobile dialog fit. Local build and mocked tests do not prove live mutations. No publishing is part of this work.

## Layout follow-up
Use the same 280–320px rail / minmax(0, 1fr) workspace as the navigation catalog,
with the 900px stacking breakpoint. AssetLibrary owns the two panels and their
viewport measurements; manager projects overview and folder controls into the
console. Replace the oversized summary row with compact metrics and remove the
nested folder panel. Bind NgxActionBar.heightChange to workspace sizing so wrapped
mobile actions and the shell header do not overlap content. Observe public panel
and body bounds with lifecycle cleanup; use ordinary document flow on mobile.

On mobile, keep the console body laid out but clipped and invisible while collapsed.
This lets Material measure form labels correctly; visibility hides controls from
focus and accessibility until expanded. Panel hosts explicitly use height:auto,
as in the reference catalog, before measuring the content/chrome difference.

## Folder workspace follow-up
Keep existing manager projection and event contracts; relocate projected folders
into a nested NgxPanel in AssetLibrary beside a second panel containing results.
Use Material tree childrenAccessor, stable expansion keys and native CDK keyboard
navigation, emitting the existing FolderFilter values. Keep server folders as flat
siblings under a virtual All folders root. Extend panel sizing to accept an owned
container boundary so nested bodies fit inside the outer workspace. Use a
container-sized asset grid and stack inner panels under 1200px. Maintain API, store,
form and federation contracts. Verify with focused tree tests plus existing suite,
production build, layout checks and authenticated desktop/mobile read-only checks.

The nested composition deliberately exceeds the approximate 230-line component
size guide (about 320 lines) to retain the user's requested panel structure in
asset-library.component.ts with projection and measured boundaries together.
Folder tree/actions and asset results remain separate presentation children.
Retain the user's dense eight-column photo layout at wide container sizes; use
container breakpoints to reduce columns as the new inner panel narrows. Preserve
unrelated in-progress card styling. Existing unused DatePipe/NgxInlineStatus
warnings in asset-card.component.ts are outside this folder change.

## Drag moves and folder menus
Use a component-scoped native HTML drag session shared by source/drop directives,
not arbitrary dataTransfer asset payloads. Directives emit typed move intentions;
the root store resolves the current asset/destination and PATCHes folderId only,
guarding pending/no-op/stale targets and committing server results with feedback.
Native browser drag image previews remain available; Edit / move asset supplies
keyboard/touch access. Material menus retain focus behavior and overlay styling.
Each tree node supplies its own folder to menu actions; triggers stop selection
propagation and appear on hover/focus or permanently on coarse pointers. Replace
foldersBody.max-height with height to fill the measured available area. Remove
normal refresh CTAs and preserve explicit loading retries. Verify actual DOM drag
sequences through mocked HTTP, including failure/retry and null Root payloads,
plus browser menu/height/responsive checks without changing live records.

## Multi-select and feedback
Results owns visible selection as local signals and checkbox presentation. Source
inputs carry the current selected assets into the page drag session; folder drops
emit AssetBatchMove. The singleton store resolves canonical assets, deduplicates,
skips same-folder items, marks the entire batch pending and uses bounded parallel
folder-only PATCH calls. Commit each server success; collect failures and produce
one final accurate action-bar summary. Retain failed cache entries and selected
visible records for retry. Keep the single-move method as a wrapper.

Shared NgxSaveFeedback in ngxActionBarFeedback consumes typed store feedback for
updates and moves. Remove result-body notices and move errors to that feedback;
loading/list errors retain their existing recovery. Increase Organize's desktop
column by 40px and project the visible count into Browse's public header slot.
Verify checkbox/group drag DOM flows, partial failures/root payloads, selection
pruning and action-bar/header rendering with mocked HTTP plus read-only browser UI.

## Header selection and compact cards
Lift the existing local AssetLibrarySelection instance into AssetLibrary and pass
it to Results, so projected header controls and grid use the same model without
signal-output synchronization. Replace the public header count slot with the
selection-toolbar component; restyle it as a two-row group and native underlined
Clear button. Replace card body with a positioned translucent overlay in the visual
preview, retaining the name's details action, tags and archived badge. Opacity-only
hover/focus visibility preserves keyboard access; coarse-pointer controls stay
visible. Use Material's public checkbox overrides plus disableRipple to suppress
state-layer glow without removing keyboard focus indicators. Verify the existing
batch suite and explicit header/card behavior, then desktop/mobile browser checks.
