import { Signal } from '@angular/core';
import { Asset, Folder } from '../services/asset-api.service';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from './asset-manager.models';

export interface AssetLibraryStore {
  readonly assets: Signal<readonly Asset[]>;
  readonly folders: Signal<readonly Folder[]>;
  readonly filtered: Signal<readonly Asset[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string>;
  readonly notice: Signal<string>;
  readonly pending: Signal<ReadonlySet<string>>;
  readonly query: Signal<string>;
  readonly archiveFilter: Signal<ArchiveFilter>;
  readonly typeFilter: Signal<AssetTypeFilter>;
  readonly storageFilter: Signal<StorageFilter>;
}

export interface AssetLibraryFiltersViewModel {
  readonly query: string;
  readonly archiveFilter: ArchiveFilter;
  readonly typeFilter: AssetTypeFilter;
  readonly storageFilter: StorageFilter;
}

export interface AssetLibraryResultsViewModel {
  readonly folders: readonly Folder[];
  readonly assets: readonly Asset[];
  readonly totalAssets: number;
  readonly loading: boolean;
  readonly error: string;
  readonly notice: string;
  readonly pendingIds: ReadonlySet<string>;
}

export interface AssetLibraryViewModel {
  readonly filters: AssetLibraryFiltersViewModel;
  readonly results: AssetLibraryResultsViewModel;
}
