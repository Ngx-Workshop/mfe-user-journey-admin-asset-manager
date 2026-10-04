import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Asset } from '../services/asset-api.service';
import { AssetLibraryFiltersComponent } from './asset-library-filters.component';
import {
  AssetLibraryStore,
  AssetLibraryViewModel,
} from './asset-library.models';
import { AssetLibraryResultsComponent } from './asset-library-results.component';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from './asset-manager.models';

@Component({
  selector: 'ngx-asset-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetLibraryFiltersComponent,
    AssetLibraryResultsComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    @let vm = viewModel();
    <section class="asset-library" aria-labelledby="asset-library-title">
      <header class="asset-library__heading">
        <h2 id="asset-library-title" class="asset-library__title">
          Asset library
        </h2>
        <button
          mat-button
          (click)="refresh.emit()"
          [disabled]="vm.results.loading"
        >
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </header>

      <ngx-asset-library-filters
        [viewModel]="vm.filters"
        (queryChange)="queryChange.emit($event)"
        (archiveFilterChange)="archiveFilterChange.emit($event)"
        (typeFilterChange)="typeFilterChange.emit($event)"
        (storageFilterChange)="storageFilterChange.emit($event)"
      />
      <ngx-asset-library-results
        [viewModel]="vm.results"
        (refresh)="refresh.emit()"
        (resetFilters)="resetFilters.emit()"
        (upload)="upload.emit()"
        (showDetails)="showDetails.emit($event)"
        (edit)="edit.emit($event)"
        (archive)="archive.emit($event)"
        (remove)="remove.emit($event)"
      />
    </section>
  `,
  styles: `
    .asset-library {
      padding: 1.5rem;
      border: 1px solid var(--mat-sys-outline-variant, #e4e4eb);
      border-radius: 1rem;
    }

    .asset-library__heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .asset-library__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    @media (max-width: 720px) {
      .asset-library {
        padding: 1rem;
      }
    }
  `,
})
export class AssetLibraryComponent {
  readonly store = input.required<AssetLibraryStore>();
  readonly viewModel = computed<AssetLibraryViewModel>(() => {
    const store = this.store();
    return {
      filters: {
        query: store.query(),
        archiveFilter: store.archiveFilter(),
        typeFilter: store.typeFilter(),
        storageFilter: store.storageFilter(),
      },
      results: {
        assets: store.filtered(),
        totalAssets: store.assets().length,
        loading: store.loading(),
        error: store.error(),
        notice: store.notice(),
        pendingIds: store.pending(),
      },
    };
  });

  readonly refresh = output<void>();
  readonly resetFilters = output<void>();
  readonly upload = output<void>();
  readonly showDetails = output<Asset>();
  readonly edit = output<Asset>();
  readonly archive = output<Asset>();
  readonly remove = output<Asset>();
  readonly queryChange = output<string>();
  readonly archiveFilterChange = output<ArchiveFilter>();
  readonly typeFilterChange = output<AssetTypeFilter>();
  readonly storageFilterChange = output<StorageFilter>();
}
