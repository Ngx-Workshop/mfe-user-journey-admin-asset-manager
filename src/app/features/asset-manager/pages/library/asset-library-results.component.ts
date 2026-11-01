import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import { Asset } from '../../models/asset.models';
import { folderLabel } from '../../utils/asset-utils';
import { AssetLibraryEmptyComponent } from './asset-library-empty.component';
import { AssetDragSource } from './asset-drag-drop';
import { AssetCardComponent } from './asset-card.component';
import {
  AssetLibraryResultsViewModel,
  AssetSelectionViewModel,
} from './asset-library.models';

@Component({
  selector: 'ngx-asset-library-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetLibraryEmptyComponent,
    MatCheckboxModule,
    AssetDragSource,
    NgxButton,
    AssetCardComponent,
    MatButtonModule,
    MatProgressBarModule,
  ],
  template: `
    @let vm = viewModel();
    @if (vm.error) {
      <div class="asset-results__error" role="alert">
        <span>{{ vm.error }}</span>
        <button
          mat-button
          ngxButton
          surface="outline"
          (click)="refresh.emit()"
          [disabled]="vm.loading"
        >
          Retry loading
        </button>
      </div>
    }
    @if (vm.loading) {
      <mat-progress-bar
        mode="indeterminate"
        aria-label="Loading assets"
      />
      <p class="asset-results__loading" role="status">
        Loading your library…
      </p>
    } @else if (!vm.error || vm.totalAssets > 0) {
      @if (vm.assets.length) {
        <div class="asset-results__grid">
          @for (asset of vm.assets; track asset._id) {
            <div
              class="asset-results__item"
              [class.asset-results__item--selected]="
                selection().selectedIds.has(asset._id)
              "
            >
              <mat-checkbox
                class="asset-results__checkbox"
                [disableRipple]="true"
                [aria-label]="'Select ' + asset.name"
                [checked]="selection().selectedIds.has(asset._id)"
                [disabled]="
                  vm.loading ||
                  vm.moving ||
                  vm.pendingIds.has(asset._id)
                "
                (change)="
                  selectionChange.emit({
                    assetId: asset._id,
                    selected: $event.checked,
                  })
                "
                (dragstart)="$event.preventDefault()"
              />
              <ngx-asset-card
                [asset]="asset"
                [assetDragSource]="asset"
                [assetDragSelection]="selection().selectedAssets"
                (assetDragStarted)="dragStart.emit(asset)"
                aria-description="Drag to a folder to move this asset, or use Edit / move asset in its actions menu."
                [assetDragDisabled]="
                  vm.loading ||
                  vm.moving ||
                  vm.pendingIds.has(asset._id) ||
                  (selection().selectedIds.has(asset._id) &&
                    selection().selectedPending)
                "
                [folderName]="folderName(asset.folderId, vm.folders)"
                [pending]="vm.pendingIds.has(asset._id)"
                (details)="showDetails.emit(asset)"
                (edit)="edit.emit(asset)"
                (archive)="archive.emit(asset)"
                (remove)="remove.emit(asset)"
              />
            </div>
          }
        </div>
      } @else {
        <ngx-asset-library-empty
          [totalAssets]="vm.totalAssets"
          (resetFilters)="resetFilters.emit()"
          (upload)="upload.emit()"
        />
      }
    }
  `,
  styles: `
    @use '@angular/material' as mat;
    :host {
      display: block;
      min-width: 0;
      container-type: inline-size;
    }
    .asset-results__item {
      position: relative;
      min-width: 0;
      border-radius: var(--ngx-radius);
    }
    .asset-results__item--selected {
      outline: 1px solid var(--ngx-color-primary);
      outline-offset: -2px;
    }
    .asset-results__checkbox {
      position: absolute;
      top: 2px;
      left: 2px;
      z-index: 3;
      background: transparent;
      box-shadow: none;
      border-radius: var(--ngx-radius);
      @include mat.checkbox-overrides(
        (
          selected-focus-state-layer-opacity: 0,
          selected-hover-state-layer-opacity: 0,
          selected-pressed-state-layer-opacity: 0,
          unselected-focus-state-layer-opacity: 0,
          unselected-hover-state-layer-opacity: 0,
          unselected-pressed-state-layer-opacity: 0,
        )
      );
    }
    ngx-asset-card {
      display: block;
      cursor: grab;
    }
    ngx-asset-card[draggable='false'] {
      cursor: default;
    }
    .asset-results__error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      color: var(--ngx-color-error);
      background: var(--ngx-color-surface-high);
    }

    .asset-results__loading {
      font-size: 0.8125rem;
      color: var(--ngx-color-muted);
    }

    .asset-results__grid {
      display: grid;
      grid-template-columns: repeat(8, minmax(0, 1fr));
      gap: 0.25rem;
    }

    .asset-results__grid > * {
      min-width: 0;
    }
    .asset-drag-source--active {
      opacity: 0.55;
    }
    @container (max-width: 900px) {
      .asset-results__grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }
    @container (max-width: 660px) {
      .asset-results__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @container (max-width: 440px) {
      .asset-results__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @container (max-width: 240px) {
      .asset-results__grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (max-width: 720px) {
      .asset-results__grid {
        grid-template-columns: minmax(0, 1fr);
      }

      .asset-results__error {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `,
})
export class AssetLibraryResultsComponent {
  readonly folderName = folderLabel;
  readonly viewModel = input.required<AssetLibraryResultsViewModel>();
  readonly selection = input.required<AssetSelectionViewModel>();
  readonly selectionChange = output<{
    assetId: string;
    selected: boolean;
  }>();
  readonly dragStart = output<Asset>();
  readonly refresh = output<void>();
  readonly resetFilters = output<void>();
  readonly upload = output<void>();
  readonly showDetails = output<Asset>();
  readonly edit = output<Asset>();
  readonly archive = output<Asset>();
  readonly remove = output<Asset>();
}
