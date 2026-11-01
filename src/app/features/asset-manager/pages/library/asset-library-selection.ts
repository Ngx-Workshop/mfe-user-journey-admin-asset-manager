import { computed, effect, signal } from '@angular/core';
import { Asset } from '../../models/asset.models';
import {
  AssetLibraryResultsViewModel,
  AssetSelectionViewModel,
} from './asset-library.models';

/** Selection is limited to the current result set and never owns server data. */
export class AssetLibrarySelection {
  readonly emptySelection: ReadonlySet<string> = new Set();
  readonly selectedIds = signal<ReadonlySet<string>>(
    this.emptySelection
  );
  readonly selectedAssets = computed(() =>
    this.viewModel().assets.filter((asset) =>
      this.selectedIds().has(asset._id)
    )
  );
  readonly selectableAssets = computed(() =>
    this.viewModel().assets.filter(
      (asset) => !this.viewModel().pendingIds.has(asset._id)
    )
  );
  readonly allSelected = computed(
    () =>
      this.selectableAssets().length > 0 &&
      this.selectableAssets().every((asset) =>
        this.selectedIds().has(asset._id)
      )
  );
  readonly selectedPending = computed(() =>
    this.selectedAssets().some((asset) =>
      this.viewModel().pendingIds.has(asset._id)
    )
  );
  readonly snapshot = computed<AssetSelectionViewModel>(() => ({
    selectedIds: this.selectedIds(),
    selectedAssets: this.selectedAssets(),
    selectedPending: this.selectedPending(),
  }));
  constructor(
    private readonly viewModel: () => AssetLibraryResultsViewModel
  ) {
    effect(() => {
      const visible = new Set(
        this.viewModel().assets.map((asset) => asset._id)
      );
      this.selectedIds.update((ids) => {
        const next = new Set(
          [...ids].filter((id) => visible.has(id))
        );
        return next.size === ids.size ? ids : next;
      });
    });
  }
  toggle(id: string, checked: boolean): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  selectAll(checked: boolean): void {
    this.selectedIds.set(
      checked
        ? new Set(this.selectableAssets().map((asset) => asset._id))
        : this.emptySelection
    );
  }
  beginDrag(asset: Asset): void {
    if (!this.selectedIds().has(asset._id))
      this.selectedIds.set(new Set([asset._id]));
  }
}
