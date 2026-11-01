import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  NgxButton,
  NgxPanel,
} from '@tmdjr/ngx-workshop-design-system';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from '../../models/asset-manager.models';
import { Asset } from '../../models/asset.models';
import { AssetLibraryFiltersComponent } from './asset-library-filters.component';
import { AssetLibrarySelection } from './asset-library-selection';
import { AssetSelectionToolbarComponent } from './asset-selection-toolbar.component';
import { AssetLibraryResultsComponent } from './asset-library-results.component';
import { AssetLibraryViewModel } from './asset-library.models';
import { observeAssetPanel } from './asset-panel-viewport';

@Component({
  selector: 'ngx-asset-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetSelectionToolbarComponent,
    NgxPanel,
    NgxButton,
    AssetLibraryFiltersComponent,
    AssetLibraryResultsComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    @let vm = viewModel();
    <div class="asset-library">
      <ngx-panel
        class="asset-library__console"
        heading="Library console"
        eyebrow="CONTENT / FILTER"
        shape="chamfered"
        background="solid"
      >
        <button
          ngxPanelHeader
          mat-button
          ngxButton
          surface="outline"
          class="asset-library__toggle"
          [attr.aria-expanded]="controlsExpanded()"
          aria-controls="asset-library-controls"
          (click)="controlsExpanded.set(!controlsExpanded())"
        >
          <mat-icon>{{
            controlsExpanded() ? 'expand_less' : 'tune'
          }}</mat-icon>
          {{ controlsExpanded() ? 'Hide controls' : 'Show controls' }}
        </button>
        <aside
          #consoleBody
          id="asset-library-controls"
          [class.asset-library__console-body--expanded]="
            controlsExpanded()
          "
          class="asset-library__console-body"
          aria-label="Library controls"
          tabindex="0"
          [style.max-height.px]="consoleHeight()"
        >
          <ng-content select="[assetLibrarySearch]" />
          <ng-content select="[assetLibraryOverview]" />
          <ngx-asset-library-filters
            [viewModel]="vm.filters"
            (archiveFilterChange)="archiveFilterChange.emit($event)"
            (typeFilterChange)="typeFilterChange.emit($event)"
            (storageFilterChange)="storageFilterChange.emit($event)"
          />
          <button
            mat-flat-button
            ngxButton
            surface="outline"
            class="asset-library__reset"
            (click)="resetFilters.emit()"
          >
            <mat-icon>filter_alt_off</mat-icon>Reset filters
          </button>
        </aside>
      </ngx-panel>
      <ngx-panel
        class="asset-library__workspace"
        heading="Asset library"
        eyebrow="CONTENT / RESULTS"
        shape="chamfered"
        background="grid"
      >
        <section
          #resultsBody
          class="asset-library__results"
          aria-label="Asset workspace"
          [style.height.px]="resultsHeight()"
        >
          <ngx-panel
            class="asset-library__inner-panel"
            heading="Folders"
            eyebrow="LIBRARY / ORGANIZE"
            shape="chamfered"
            background="solid"
          >
            <div
              #foldersBody
              class="asset-library__scroll-body"
              [style.height.px]="foldersHeight()"
            >
              <ng-content select="[assetLibraryFolders]" />
              <!-- <ng-content select="[assetLibraryGuidance]" /> -->
            </div>
          </ngx-panel>
          <ngx-panel
            class="asset-library__inner-panel asset-library__browse-panel"
            heading="Assets"
            eyebrow="LIBRARY / BROWSE"
            shape="chamfered"
            background="solid"
          >
            <ngx-asset-selection-toolbar
              ngxPanelHeader
              class="asset-library__selection-controls"
              [selectedCount]="selection.selectedAssets().length"
              [selectableCount]="selection.selectableAssets().length"
              [allSelected]="selection.allSelected()"
              [busy]="vm.results.loading || vm.results.moving"
              (selectAll)="selection.selectAll($event)"
              (clear)="
                selection.selectedIds.set(selection.emptySelection)
              "
            />
            <section
              #photosBody
              class="asset-library__scroll-body"
              tabindex="0"
              aria-label="Scrollable asset library"
              [style.height.px]="photosHeight()"
            >
              <ngx-asset-library-results
                [viewModel]="vm.results"
                [selection]="selection.snapshot()"
                (selectionChange)="
                  selection.toggle($event.assetId, $event.selected)
                "
                (dragStart)="selection.beginDrag($event)"
                (refresh)="refresh.emit()"
                (resetFilters)="resetFilters.emit()"
                (upload)="upload.emit()"
                (showDetails)="showDetails.emit($event)"
                (edit)="edit.emit($event)"
                (archive)="archive.emit($event)"
                (remove)="remove.emit($event)"
              />
            </section>
          </ngx-panel>
        </section>
      </ngx-panel>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .asset-library {
      display: grid;
      grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
      gap: var(--ngx-space-4);
      align-items: start;
    }
    .asset-library__console {
      position: sticky;
      top: calc(
        var(--ngx-action-bar-top, 96px) +
          var(--asset-action-bar-height, 56px) + 16px
      );
    }
    .asset-library__console,
    .asset-library__workspace {
      min-width: 0;
      height: auto;
    }
    .asset-library__console-body {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-space-4);
      overflow-y: auto;
      scrollbar-width: thin;
      min-height: 0;
    }
    .asset-library__console-body > * {
      flex-shrink: 0;
    }
    .asset-library__results {
      display: grid;
      grid-template-columns: minmax(240px, 290px) minmax(0, 1fr);
      gap: var(--ngx-space-4);
      min-height: 0;
      align-items: start;
    }
    .asset-library__browse-panel {
      container-type: inline-size;
    }
    @container (max-width: 400px) {
      .asset-library__selection-controls {
        width: 100cqw;
        max-width: 100%;
      }
    }
    .asset-library__selection-controls {
      display: block;
      text-align: right;
      margin-inline-start: auto;
      color: var(--ngx-color-primary);
      font: var(--ngx-font-label);
    }
    .asset-library__inner-panel {
      min-width: 0;
      height: auto;
    }
    .asset-library__scroll-body {
      min-height: 0;
      overflow: auto;
      scrollbar-width: thin;
      color: var(--ngx-color-text);
    }
    .asset-library__console-body:focus-visible,
    .asset-library__scroll-body:focus-visible {
      outline: 2px solid var(--ngx-color-primary);
      outline-offset: -2px;
    }
    .asset-library__reset {
      width: 100%;
    }
    .asset-library__toggle {
      display: none;
    }
    @media (max-width: 1200px) {
      .asset-library__results {
        grid-template-columns: minmax(0, 1fr);
      }
      .asset-library__scroll-body {
        overflow: visible;
      }
    }
    @media (max-width: 900px) {
      .asset-library {
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
      }
      .asset-library__console {
        position: static;
      }
      .asset-library__results {
        overflow: visible;
      }
      .asset-library__toggle {
        display: inline-flex;
      }
      .asset-library__console-body {
        max-height: 0;
        overflow: hidden;
        visibility: hidden;
      }
      .asset-library__console-body--expanded {
        max-height: none;
        overflow: visible;
        visibility: visible;
      }
    }
  `,
})
export class AssetLibraryComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly consoleBody =
    viewChild.required<ElementRef<HTMLElement>>('consoleBody');
  private readonly resultsBody =
    viewChild.required<ElementRef<HTMLElement>>('resultsBody');
  private readonly foldersBody =
    viewChild.required<ElementRef<HTMLElement>>('foldersBody');
  private readonly photosBody =
    viewChild.required<ElementRef<HTMLElement>>('photosBody');
  readonly foldersHeight = signal<number | null>(null);
  readonly photosHeight = signal<number | null>(null);
  readonly controlsExpanded = signal(false);
  readonly consoleHeight = signal<number | null>(null);
  readonly resultsHeight = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      observeAssetPanel(
        this.consoleBody().nativeElement,
        this.destroyRef,
        (height) => this.consoleHeight.set(height)
      );
      observeAssetPanel(
        this.resultsBody().nativeElement,
        this.destroyRef,
        (height) => this.resultsHeight.set(height),
        undefined,
        1200
      );
      observeAssetPanel(
        this.foldersBody().nativeElement,
        this.destroyRef,
        (height) => this.foldersHeight.set(height),
        this.resultsBody().nativeElement
      );
      observeAssetPanel(
        this.photosBody().nativeElement,
        this.destroyRef,
        (height) => this.photosHeight.set(height),
        this.resultsBody().nativeElement
      );
    });
  }

  readonly viewModel = input.required<AssetLibraryViewModel>();
  readonly selection = new AssetLibrarySelection(
    () => this.viewModel().results
  );

  readonly refresh = output<void>();
  readonly resetFilters = output<void>();
  readonly upload = output<void>();
  readonly showDetails = output<Asset>();
  readonly edit = output<Asset>();
  readonly archive = output<Asset>();
  readonly remove = output<Asset>();
  readonly archiveFilterChange = output<ArchiveFilter>();
  readonly typeFilterChange = output<AssetTypeFilter>();
  readonly storageFilterChange = output<StorageFilter>();
}
