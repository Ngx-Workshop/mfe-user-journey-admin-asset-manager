import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="asset-filters" aria-label="Filter assets">
      <mat-form-field
        appearance="outline"
        class="asset-filters__search"
      >
        <mat-label>Search assets</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          [value]="viewModel().query"
          (input)="queryChange.emit(inputValue($event))"
          placeholder="Name, filename, description or tag"
        />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Visibility</mat-label>
        <mat-select
          [value]="viewModel().archiveFilter"
          (selectionChange)="archiveFilterChange.emit($event.value)"
        >
          <mat-option value="active">Active</mat-option>
          <mat-option value="archived">Archived</mat-option>
          <mat-option value="all">All assets</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>File type</mat-label>
        <mat-select
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
      <mat-form-field appearance="outline">
        <mat-label>Storage</mat-label>
        <mat-select
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
    .asset-filters {
      display: grid;
      grid-template-columns: minmax(15rem, 2fr) repeat(
          3,
          minmax(8.75rem, 1fr)
        );
      gap: 0.875rem;
    }

    .asset-filters__search mat-icon {
      margin: 0 0.5rem;
      opacity: 0.55;
    }

    @media (max-width: 1100px) {
      .asset-filters {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .asset-filters__search {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 720px) {
      .asset-filters {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `,
})
export class AssetLibraryFiltersComponent {
  readonly viewModel = input.required<AssetLibraryFiltersViewModel>();
  readonly queryChange = output<string>();
  readonly archiveFilterChange = output<ArchiveFilter>();
  readonly typeFilterChange = output<AssetTypeFilter>();
  readonly storageFilterChange = output<StorageFilter>();

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
