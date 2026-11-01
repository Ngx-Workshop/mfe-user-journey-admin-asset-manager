import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  NgxActionBar,
  NgxButton,
  NgxInlineStatus,
  NgxSaveFeedback,
} from '@tmdjr/ngx-workshop-design-system';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from '../../models/asset-manager.models';
import { Asset, Folder } from '../../models/asset.models';
import { AssetManagerStore } from '../../state/asset-manager.store';
import { AssetDragSession } from './asset-drag-drop';
import { AssetFolderBrowserComponent } from './asset-folder-browser.component';
import { AssetLibraryComponent } from './asset-library.component';
import { AssetManagerDialogs } from './asset-manager-dialogs';
import { AssetManagerSummaryComponent } from './asset-manager-summary.component';

@Component({
  selector: 'ngx-asset-manager',
  host: {
    '[style.--asset-action-bar-height.px]': 'actionBarHeight()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxButton,
    AssetLibraryComponent,
    AssetManagerSummaryComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxActionBar,
    NgxInlineStatus,
    NgxSaveFeedback,
    AssetFolderBrowserComponent,
  ],
  providers: [AssetManagerDialogs, AssetDragSession],
  template: `
    <ngx-action-bar
      heading="Asset Manager"
      (heightChange)="actionBarHeight.set($event)"
    >
      <ngx-inline-status
        ngxActionBarIndicators
        [label]="
          loading() ? 'Syncing library…' : assets().length + ' assets'
        "
        [tone]="error() ? 'error' : 'neutral'"
      />
      @if (store.feedback().state !== 'idle') {
      <ngx-save-feedback
        ngxActionBarFeedback
        [state]="store.feedback().state"
        [message]="store.feedback().message"
      />
      }
      <!-- <button
        mat-flat-button
        ngxButton
        surface="outline"
        (click)="edit()"
      >
        <mat-icon>add</mat-icon>
        Create record
      </button> -->
      <button
        mat-flat-button
        ngxButton
        shape="chevron"
        surface="outline"
        (click)="edit(undefined, true)"
      >
        <mat-icon>upload</mat-icon>
        Upload file
      </button>
    </ngx-action-bar>

    <main class="asset-manager">
      <ngx-asset-library
        [viewModel]="store.libraryViewModel()"
        (refresh)="refresh()"
        (resetFilters)="clearFilters()"
        (upload)="edit(undefined, true)"
        (showDetails)="details($event)"
        (edit)="edit($event)"
        (archive)="archive($event)"
        (remove)="delete($event)"
        (archiveFilterChange)="setArchiveFilter($event)"
        (typeFilterChange)="setTypeFilter($event)"
        (storageFilterChange)="setStorageFilter($event)"
      >
        <mat-form-field
          assetLibrarySearch
          class="asset-manager__search"
          appearance="outline"
          subscriptSizing="dynamic"
        >
          <mat-label>Search assets</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input
            #searchInput
            matInput
            [value]="store.query()"
            (input)="setQuery(searchInput.value)"
            placeholder="Name, filename, description or tag"
          />
        </mat-form-field>
        <ngx-asset-manager-summary
          assetLibraryOverview
          [total]="assets().length"
          [active]="activeCount()"
          [received]="receivedCount()"
          [archived]="archivedCount()"
        />
        <ngx-asset-folder-browser
          assetLibraryFolders
          [folders]="store.folders()"
          [selected]="store.folderFilter()"
          [loading]="store.foldersLoading()"
          [error]="store.foldersError()"
          [pendingIds]="store.pending()"
          [moving]="store.moving()"
          (assetMove)="store.moveAssets($event)"
          (selectionChange)="store.setFolderFilter($event)"
          (refresh)="store.refreshFolders()"
          (create)="editFolder()"
          (rename)="editFolder($event)"
          (remove)="deleteFolder($event)"
        />
        <p assetLibraryGuidance class="asset-manager__storage-note">
          <mat-icon>info_outline</mat-icon>
          Folders organize assets without changing stored URLs.
          Identical file content cannot be uploaded twice, including
          archived assets.
        </p>
      </ngx-asset-library>
    </main>
  `,
  styles: `
    @use '@angular/material' as mat;
    :host {
      display: block;
      color: var(--ngx-color-text);
      font-family: var(--ngx-font-body);
      --ngx-action-bar-top: var(--asset-toolbar-top, 96px);
    }

    .asset-manager {
      padding: var(--ngx-space-4);
    }

    .asset-manager__search {
      margin-top: var(--ngx-space-2);
      width: 100%;
      min-width: 0;
      font-size: 0.8rem;
      @include mat.form-field-overrides(
        (
          container-height: 44px,
          container-vertical-padding: 10px,
        )
      );
    }
    .asset-manager__search mat-icon {
      color: var(--ngx-color-muted);
    }
    .asset-manager__storage-note {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.5rem;
      font-size: 0.75rem;
      line-height: 1.6;
      color: var(--ngx-color-muted);
    }

    .asset-manager__storage-note mat-icon {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
      font-size: 1.125rem;
    }

    @media (max-width: 720px) {
      .asset-manager {
        padding: 0.75rem;
      }

      :host {
        --ngx-action-bar-top: var(--asset-toolbar-top, 76px);
      }

      .asset-manager__storage-note {
        align-items: flex-start;
      }
    }
  `,
})
export class AssetManagerComponent {
  readonly actionBarHeight = signal(56);
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

  edit(asset?: Asset, upload = false): void {
    this.dialogs.edit(asset, upload);
  }
  details(asset: Asset): void {
    this.dialogs.details(asset);
  }
  archive(asset: Asset): void {
    this.store.archive(asset);
  }
  editFolder(folder?: Folder): void {
    this.dialogs.editFolder(folder);
  }
  deleteFolder(folder: Folder): void {
    this.dialogs.deleteFolder(folder);
  }
  delete(asset: Asset): void {
    this.dialogs.delete(asset);
  }
}
