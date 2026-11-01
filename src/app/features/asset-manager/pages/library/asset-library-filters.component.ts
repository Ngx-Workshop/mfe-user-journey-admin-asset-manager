import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AssetLibraryFiltersViewModel } from './asset-library.models';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from '../../models/asset-manager.models';

@Component({
  selector: 'ngx-asset-library-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <div class="asset-filters" aria-label="Filter assets">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Visibility</mat-label>
        <mat-select
          panelClass="ngx-design-system-overlay ngx-select-panel"
          [value]="viewModel().archiveFilter"
          (selectionChange)="archiveFilterChange.emit($event.value)"
        >
          <mat-option value="active">Active</mat-option>
          <mat-option value="archived">Archived</mat-option>
          <mat-option value="all">All assets</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>File type</mat-label>
        <mat-select
          panelClass="ngx-design-system-overlay ngx-select-panel"
          [value]="viewModel().typeFilter"
          (selectionChange)="typeFilterChange.emit($event.value)"
        >
          <mat-option value="all">All types</mat-option>
          <mat-option value="image">Images</mat-option>
          <mat-option value="video">Videos</mat-option>
          <mat-option value="audio">Audio</mat-option>
          <mat-option value="document"
            >Documents &amp; other</mat-option
          >
          <mat-option value="record">Metadata records</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Storage</mat-label>
        <mat-select
          panelClass="ngx-design-system-overlay ngx-select-panel"
          [value]="viewModel().storageFilter"
          (selectionChange)="storageFilterChange.emit($event.value)"
        >
          <mat-option value="all">All statuses</mat-option>
          <mat-option value="PENDING_STORAGE"
            >Processing storage</mat-option
          >
          <mat-option value="READY">Stored</mat-option>
          <mat-option value="STORAGE_FAILED"
            >Storage failed</mat-option
          >
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: `
    @use '@angular/material' as mat;
    :host {
      display: block;
      min-width: 0;
      @include mat.form-field-overrides(
        (
          container-height: 44px,
          container-vertical-padding: 10px,
        )
      );
    }
    .asset-filters {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
    mat-form-field {
      width: 100%;
      min-width: 0;
      font-size: 0.8rem;
    }
    @media (min-width: 601px) and (max-width: 900px) {
      .asset-filters {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `,
})
export class AssetLibraryFiltersComponent {
  readonly viewModel = input.required<AssetLibraryFiltersViewModel>();
  readonly archiveFilterChange = output<ArchiveFilter>();
  readonly typeFilterChange = output<AssetTypeFilter>();
  readonly storageFilterChange = output<StorageFilter>();
}
