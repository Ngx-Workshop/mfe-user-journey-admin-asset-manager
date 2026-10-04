import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import {
  Asset,
  AssetApiService,
  assetError,
  formatBytes,
} from '../services/asset-api.service';
import {
  AssetDetailsComponent,
  DeleteAssetComponent,
} from './asset-details.component';
import { AssetEditorComponent } from './asset-editor.component';

export function mediaCategory(asset: Asset): string {
  const type = asset.mediaType ?? '';
  if (!asset.originalFilename) return 'record';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
}
@Component({
  selector: 'ngx-asset-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
  ],
  templateUrl: './asset-manager.component.html',
  styleUrl: './asset-manager.component.scss',
})
export class AssetManagerComponent {
  private readonly api = inject(AssetApiService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly assets = signal<Asset[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly query = signal('');
  readonly archiveFilter = signal('active');
  readonly typeFilter = signal('all');
  readonly storageFilter = signal('all');
  readonly pending = signal<Set<string>>(new Set());
  readonly bytes = formatBytes;
  readonly category = mediaCategory;
  readonly activeCount = computed(
    () => this.assets().filter((asset) => !asset.archived).length
  );
  readonly archivedCount = computed(
    () => this.assets().filter((asset) => asset.archived).length
  );
  readonly receivedCount = computed(
    () =>
      this.assets().filter(
        (asset) => asset.storageStatus === 'PENDING_STORAGE'
      ).length
  );
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.assets().filter(
      (asset) =>
        (this.archiveFilter() === 'all' ||
          asset.archived === (this.archiveFilter() === 'archived')) &&
        (this.typeFilter() === 'all' ||
          mediaCategory(asset) === this.typeFilter()) &&
        (this.storageFilter() === 'all' ||
          asset.storageStatus === this.storageFilter()) &&
        (!query ||
          [
            asset.name,
            asset.description,
            asset.originalFilename,
            ...asset.tags,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query))
    );
  });
  constructor() {
    this.refresh();
  }
  refresh(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (assets) => this.assets.set(assets),
        error: (error) => this.error.set(assetError(error)),
      });
  }
  search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  clearFilters(): void {
    this.query.set('');
    this.archiveFilter.set('active');
    this.typeFilter.set('all');
    this.storageFilter.set('all');
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
        this.assets.update((assets) => [
          saved,
          ...assets.filter((item) => item._id !== saved._id),
        ]);
        this.notice.set(
          upload
            ? 'File received. Durable storage is pending.'
            : 'Asset saved.'
        );
      });
  }
  details(asset: Asset): void {
    if (this.pending().has(asset._id)) return;
    this.setPending(asset._id, true);
    this.error.set('');
    this.api
      .get(asset._id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setPending(asset._id, false))
      )
      .subscribe({
        next: (fresh) =>
          this.dialog.open(AssetDetailsComponent, {
            data: fresh,
            width: '640px',
            maxWidth: '95vw',
          }),
        error: (error) => this.error.set(assetError(error)),
      });
  }
  archive(asset: Asset): void {
    if (this.pending().has(asset._id)) return;
    this.setPending(asset._id, true);
    this.error.set('');
    this.api
      .archive(asset._id, !asset.archived)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setPending(asset._id, false))
      )
      .subscribe({
        next: (saved) => {
          this.assets.update((assets) =>
            assets.map((item) =>
              item._id === saved._id ? saved : item
            )
          );
          this.notice.set(
            saved.archived ? 'Asset archived.' : 'Asset restored.'
          );
        },
        error: (error) => this.error.set(assetError(error)),
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
        if (!confirmed || this.pending().has(asset._id)) return;
        this.setPending(asset._id, true);
        this.error.set('');
        this.api
          .remove(asset._id)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.setPending(asset._id, false))
          )
          .subscribe({
            next: () => {
              this.assets.update((assets) =>
                assets.filter((item) => item._id !== asset._id)
              );
              this.notice.set('Asset deleted.');
            },
            error: (error) => this.error.set(assetError(error)),
          });
      });
  }
  icon(asset: Asset): string {
    return {
      image: 'image',
      video: 'movie',
      audio: 'music_note',
      document: 'description',
      record: 'inventory_2',
    }[
      mediaCategory(asset) as
        | 'image'
        | 'video'
        | 'audio'
        | 'document'
        | 'record'
    ];
  }
  private setPending(id: string, value: boolean): void {
    this.pending.update((ids) => {
      const next = new Set(ids);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
