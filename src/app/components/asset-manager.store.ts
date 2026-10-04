import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, finalize } from 'rxjs';
import {
  Asset,
  AssetApiService,
  Folder,
  assetError,
} from '../services/asset-api.service';
import {
  ArchiveFilter,
  AssetTypeFilter,
  FolderFilter,
  FolderResult,
  StorageFilter,
} from './asset-manager.models';
import { mediaCategory } from './asset-manager.utils';

@Injectable()
export class AssetManagerStore {
  private readonly api = inject(AssetApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly assetsState = signal<readonly Asset[]>([]);
  private readonly foldersState = signal<readonly Folder[]>([]);
  private readonly foldersLoadingState = signal(false);
  private readonly foldersErrorState = signal('');
  private readonly folderFilterState = signal<FolderFilter>('all');
  private readonly loadingState = signal(false);
  private readonly errorState = signal('');
  private readonly noticeState = signal('');
  private readonly queryState = signal('');
  private readonly archiveFilterState =
    signal<ArchiveFilter>('active');
  private readonly typeFilterState = signal<AssetTypeFilter>('all');
  private readonly storageFilterState =
    signal<StorageFilter>('all');
  private readonly pendingState = signal<ReadonlySet<string>>(
    new Set()
  );

  readonly assets = this.assetsState.asReadonly();
  readonly folders = this.foldersState.asReadonly();
  readonly foldersLoading = this.foldersLoadingState.asReadonly();
  readonly foldersError = this.foldersErrorState.asReadonly();
  readonly folderFilter = this.folderFilterState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly archiveFilter = this.archiveFilterState.asReadonly();
  readonly typeFilter = this.typeFilterState.asReadonly();
  readonly storageFilter = this.storageFilterState.asReadonly();
  readonly pending = this.pendingState.asReadonly();

  readonly activeCount = computed(
    () => this.assets().filter((asset) => !asset.archived).length
  );
  readonly archivedCount = computed(
    () => this.assets().filter((asset) => asset.archived).length
  );
  readonly receivedCount = computed(
    () =>
      this.assets().filter(
        (asset) => asset.storageStatus === 'READY'
      ).length
  );
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.assets().filter(
      (asset) =>
        (this.folderFilter() === 'all' || (asset.folderId ?? null) === this.folderFilter()) &&
        this.matchesArchiveFilter(asset) &&
        this.matchesTypeFilter(asset) &&
        this.matchesStorageFilter(asset) &&
        this.matchesQuery(asset, query)
    );
  });

  refresh(): void {
    if (this.loading()) return;
    this.loadingState.set(true);
    this.errorState.set('');
    this.api
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingState.set(false))
      )
      .subscribe({
        next: (assets) => this.assetsState.set(assets),
        error: (error) => this.setError(error),
      });
  }

  refreshFolders(): void {
    if (this.foldersLoading()) return;
    this.foldersLoadingState.set(true);
    this.foldersErrorState.set('');
    this.api.listFolders().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.foldersLoadingState.set(false))
    ).subscribe({
      next: (folders) => {
        this.foldersState.set(folders);
        const selected = this.folderFilter();
        if (selected !== 'all' && selected !== null && !folders.some((folder) => folder._id === selected))
          this.folderFilterState.set('all');
      },
      error: (error: unknown) => this.foldersErrorState.set(assetError(error, 'folder-list')),
    });
  }

  setFolderFilter(folder: FolderFilter): void {
    this.folderFilterState.set(folder);
  }

  saveFolder(result: FolderResult): void {
    if ('saved' in result) {
      this.foldersState.update((folders) => [
        ...folders.filter((folder) => folder._id !== result.saved._id),
        result.saved,
      ]);
      this.noticeState.set('Folder saved.');
    } else {
      this.foldersState.update((folders) => folders.filter((folder) => folder._id !== result.removed));
      if (this.folderFilter() === result.removed) this.folderFilterState.set('all');
      this.noticeState.set('Folder deleted.');
    }
  }

  setQuery(query: string): void {
    this.queryState.set(query);
  }

  setArchiveFilter(filter: ArchiveFilter): void {
    this.archiveFilterState.set(filter);
  }

  setTypeFilter(filter: AssetTypeFilter): void {
    this.typeFilterState.set(filter);
  }

  setStorageFilter(filter: StorageFilter): void {
    this.storageFilterState.set(filter);
  }

  clearFilters(): void {
    this.folderFilterState.set('all');
    this.queryState.set('');
    this.archiveFilterState.set('active');
    this.typeFilterState.set('all');
    this.storageFilterState.set('all');
  }

  save(asset: Asset, uploaded: boolean): void {
    this.assetsState.update((assets) => [
      asset,
      ...assets.filter((item) => item._id !== asset._id),
    ]);
    this.noticeState.set(
      uploaded
        ? 'File uploaded and stored.'
        : 'Asset saved.'
    );
  }

  loadDetails(asset: Asset): Observable<Asset> {
    if (this.pending().has(asset._id)) return EMPTY;
    this.setPending(asset._id, true);
    this.errorState.set('');
    return this.api.get(asset._id).pipe(
      finalize(() => this.setPending(asset._id, false)),
      catchError((error: unknown) => {
        this.setError(error);
        return EMPTY;
      })
    );
  }

  archive(asset: Asset): void {
    if (this.pending().has(asset._id)) return;
    this.setPending(asset._id, true);
    this.errorState.set('');
    this.api
      .archive(asset._id, !asset.archived)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setPending(asset._id, false))
      )
      .subscribe({
        next: (saved) => {
          this.assetsState.update((assets) =>
            assets.map((item) =>
              item._id === saved._id ? saved : item
            )
          );
          this.noticeState.set(
            saved.archived ? 'Asset archived.' : 'Asset restored.'
          );
        },
        error: (error) => this.setError(error),
      });
  }

  remove(asset: Asset): void {
    if (this.pending().has(asset._id)) return;
    this.setPending(asset._id, true);
    this.errorState.set('');
    this.api
      .remove(asset._id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setPending(asset._id, false))
      )
      .subscribe({
        next: () => {
          this.assetsState.update((assets) =>
            assets.filter((item) => item._id !== asset._id)
          );
          this.noticeState.set('Asset deleted.');
        },
        error: (error) => this.setError(error),
      });
  }

  private matchesArchiveFilter(asset: Asset): boolean {
    return (
      this.archiveFilter() === 'all' ||
      asset.archived === (this.archiveFilter() === 'archived')
    );
  }

  private matchesTypeFilter(asset: Asset): boolean {
    return (
      this.typeFilter() === 'all' ||
      mediaCategory(asset) === this.typeFilter()
    );
  }

  private matchesStorageFilter(asset: Asset): boolean {
    return (
      this.storageFilter() === 'all' ||
      asset.storageStatus === this.storageFilter()
    );
  }

  private matchesQuery(asset: Asset, query: string): boolean {
    if (!query) return true;
    return [
      asset.name,
      asset.description,
      asset.originalFilename,
      ...asset.tags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  }

  private setError(error: unknown): void {
    this.errorState.set(assetError(error));
  }

  private setPending(id: string, pending: boolean): void {
    this.pendingState.update((ids) => {
      const next = new Set(ids);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
