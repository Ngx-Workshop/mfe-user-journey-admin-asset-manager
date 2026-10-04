import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Asset } from '../services/asset-api.service';
import {
  AssetDetailsComponent,
  DeleteAssetComponent,
} from './asset-details.component';
import { AssetEditorComponent } from './asset-editor.component';
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
  ],
  providers: [AssetManagerStore],
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
      <ngx-asset-library
        [store]="store"
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
      <p class="asset-manager__storage-note">
        <mat-icon>info_outline</mat-icon>
        Files are received as pending storage. Preview and download
        will be available when durable storage is supported.
      </p>
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
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.375rem;
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
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

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

  edit(asset?: Asset, upload = false): void {
    this.dialog
      .open(AssetEditorComponent, {
        data: { asset, upload },
        width: '560px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved: Asset | undefined) => {
        if (!saved) return;
        this.store.save(saved, upload);
      });
  }

  details(asset: Asset): void {
    this.store
      .loadDetails(asset)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fresh) => {
        this.dialog.open(AssetDetailsComponent, {
          data: fresh,
          width: '640px',
          maxWidth: '95vw',
        });
      });
  }

  archive(asset: Asset): void {
    this.store.archive(asset);
  }

  delete(asset: Asset): void {
    this.dialog
      .open(DeleteAssetComponent, {
        data: asset,
        width: '440px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) this.store.remove(asset);
      });
  }
}
