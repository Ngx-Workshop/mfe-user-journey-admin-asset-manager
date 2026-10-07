import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Asset, Folder } from '../services/asset.models';
import { AssetFolderBrowserComponent } from './asset-folder-browser.component';
import { AssetManagerDialogs } from './asset-manager-dialogs';
import { AssetLibraryComponent } from './asset-library.component';
import { MfeAssetManagerHeader } from './asset-manager-header.component';
import { AssetManagerSummaryComponent } from './asset-manager-summary.component';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from './asset-manager.models';
import { AssetManagerStore } from './asset-manager.store';

@Component({
  selector: 'ngx-asset-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetLibraryComponent,
    AssetManagerSummaryComponent,
    MatButtonModule,
    MatIconModule,
    MfeAssetManagerHeader,
    AssetFolderBrowserComponent,
  ],
  providers: [AssetManagerDialogs],
  template: `
    <ngx-mfe-asset-manager-header />
    <nav class="asset-manager__actions" aria-label="Asset actions">
      <button mat-flat-button (click)="edit()">
        <mat-icon>add</mat-icon>
        Create record
      </button>
      <button mat-flat-button (click)="edit(undefined, true)">
        <mat-icon>upload</mat-icon>
        Upload file
      </button>
    </nav>

    <main class="asset-manager">
      <ngx-asset-manager-summary
        [total]="assets().length"
        [active]="activeCount()"
        [received]="receivedCount()"
        [archived]="archivedCount()"
      />
      <ngx-asset-folder-browser
        [folders]="store.folders()"
        [selected]="store.folderFilter()"
        [loading]="store.foldersLoading()"
        [error]="store.foldersError()"
        (selectionChange)="store.setFolderFilter($event)"
        (refresh)="store.refreshFolders()"
        (create)="editFolder()"
        (rename)="editFolder($event)"
        (remove)="deleteFolder($event)"
      />
      <p class="asset-manager__storage-note">
        <mat-icon>info_outline</mat-icon>
        Folders organize assets without changing stored URLs.
        Identical file content cannot be uploaded twice, including
        archived assets.
      </p>
      <ngx-asset-library
        [viewModel]="store.libraryViewModel()"
        (refresh)="refresh()"
        (resetFilters)="clearFilters()"
        (upload)="edit(undefined, true)"
        (showDetails)="details($event)"
        (edit)="edit($event)"
        (archive)="archive($event)"
        (remove)="delete($event)"
        (queryChange)="setQuery($event)"
        (archiveFilterChange)="setArchiveFilter($event)"
        (typeFilterChange)="setTypeFilter($event)"
        (storageFilterChange)="setStorageFilter($event)"
      />
    </main>
  `,
  styles: `
    :host {
      display: block;
      color: var(--mat-sys-on-surface, #242731);
    }

    .asset-manager {
      max-width: 1440px;
      margin: auto;
      padding: 2.5rem 2rem;
    }

    .asset-manager__actions {
      position: sticky;
      top: 3.5rem;
      z-index: 10;
      display: flex;
      min-height: 4rem;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0 1.5rem;
      background: var(--mat-sys-primary);
      box-shadow: 0 0.5rem 1.5rem rgba(20, 24, 40, 0.04);
      backdrop-filter: blur(1rem);
    }

    .asset-manager__storage-note {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.5rem;
      font-size: 0.75rem;
      line-height: 1.6;
      opacity: 0.65;
    }

    .asset-manager__storage-note mat-icon {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
      font-size: 1.125rem;
    }

    @media (max-width: 720px) {
      .asset-manager {
        padding: 1.5rem 1rem;
      }

      .asset-manager__actions {
        flex-wrap: wrap;
      }

      .asset-manager__storage-note {
        align-items: flex-start;
      }
    }
  `,
})
export class AssetManagerComponent {
  readonly store = inject(AssetManagerStore);
  private readonly dialogs = inject(AssetManagerDialogs);

  readonly assets = this.store.assets;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly pending = this.store.pending;
  readonly activeCount = this.store.activeCount;
  readonly archivedCount = this.store.archivedCount;
  readonly receivedCount = this.store.receivedCount;
  readonly filtered = this.store.filtered;

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.store.refresh();
    this.store.refreshFolders();
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  setQuery(query: string): void {
    this.store.setQuery(query);
  }

  setArchiveFilter(filter: ArchiveFilter): void {
    this.store.setArchiveFilter(filter);
  }

  setTypeFilter(filter: AssetTypeFilter): void {
    this.store.setTypeFilter(filter);
  }

  setStorageFilter(filter: StorageFilter): void {
    this.store.setStorageFilter(filter);
  }

  edit(asset?: Asset, upload = false): void { this.dialogs.edit(asset, upload); }
  details(asset: Asset): void { this.dialogs.details(asset); }
  archive(asset: Asset): void { this.store.archive(asset); }
  editFolder(folder?: Folder): void { this.dialogs.editFolder(folder); }
  deleteFolder(folder: Folder): void { this.dialogs.deleteFolder(folder); }
  delete(asset: Asset): void { this.dialogs.delete(asset); }
}
