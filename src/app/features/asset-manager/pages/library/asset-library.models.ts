import { Asset, Folder } from '../../models/asset.models';
import {
  ArchiveFilter,
  AssetTypeFilter,
  StorageFilter,
} from '../../models/asset-manager.models';

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
