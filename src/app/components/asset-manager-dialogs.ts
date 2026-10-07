import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Asset, Folder } from '../services/asset.models';
import { folderLabel } from '../services/asset-utils';
import { AssetDetailsComponent, DeleteAssetComponent } from './asset-details.component';
import { AssetEditorComponent } from './asset-editor.component';
import { AssetFolderEditorComponent } from './asset-folder-editor.component';
import { FolderEditorData } from './asset-manager.models';
import { AssetManagerStore } from './asset-manager.store';

// Scoped to the page: subscriptions opening dialogs end when that page is destroyed.
@Injectable()
export class AssetManagerDialogs {
  private readonly store = inject(AssetManagerStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  edit(asset?: Asset, upload = false): void {
    this.dialog
      .open(AssetEditorComponent, {
        data: {
          asset,
          upload,
          folders: this.store.folders(),
          folderId:
            this.store.folderFilter() === 'all'
              ? null
              : this.store.folderFilter(),
        },
        width: '560px',
        maxWidth: '95vw',
      });
  }

  details(asset: Asset): void {
    this.store
      .loadDetails(asset)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fresh) => {
        this.dialog.open(AssetDetailsComponent, {
          data: {
            asset: fresh,
            folderName: folderLabel(
              fresh.folderId,
              this.store.folders()
            ),
          },
          width: '640px',
          maxWidth: '95vw',
        });
      });
  }

  editFolder(folder?: Folder): void {
    this.openFolderEditor({ folder });
  }

  deleteFolder(folder: Folder): void {
    this.openFolderEditor({ folder, remove: true });
  }

  private openFolderEditor(data: FolderEditorData): void {
    this.dialog
      .open(AssetFolderEditorComponent, {
        data,
        width: '440px',
        maxWidth: '95vw',
      });
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
