import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { Asset } from '../../models/asset.models';
import {
  AssetBatchMove,
  FolderFilter,
} from '../../models/asset-manager.models';

/** A page-local drag session: external files and serialized objects never become assets. */
@Injectable({ providedIn: 'root' })
export class AssetDragSession {
  private readonly state = signal<readonly Asset[]>([]);
  readonly assets = this.state.asReadonly();
  readonly asset = computed(() => this.assets()[0] ?? null);
  start(
    event: DragEvent,
    asset: Asset,
    selection: readonly Asset[] = []
  ): void {
    if (!event.dataTransfer) return;
    const assets = selection.some((item) => item._id === asset._id)
      ? selection
      : [asset];
    event.dataTransfer.setData(
      'application/x-ngx-assets',
      JSON.stringify(assets.map((item) => item._id))
    );
    event.dataTransfer.effectAllowed = 'move';
    this.state.set([...assets]);
  }
  end(): void {
    this.state.set([]);
  }
}

@Directive({
  selector: '[assetDragSource]',
  host: {
    '[attr.draggable]': '!assetDragDisabled()',
    '[class.asset-drag-source--active]': 'isDragging()',
    '(dragstart)': 'start($event)',
    '(dragend)': 'session.end()',
  },
})
export class AssetDragSource {
  readonly session = inject(AssetDragSession);
  readonly assetDragSource = input.required<Asset>();
  readonly assetDragDisabled = input(false);
  readonly assetDragSelection = input<readonly Asset[]>([]);
  readonly assetDragStarted = output<Asset>();
  isDragging(): boolean {
    return this.session
      .assets()
      .some((asset) => asset._id === this.assetDragSource()._id);
  }
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.isDragging()) this.session.end();
    });
  }
  start(event: DragEvent): void {
    if (this.assetDragDisabled()) {
      event.preventDefault();
      return;
    }
    this.assetDragStarted.emit(this.assetDragSource());
    this.session.start(
      event,
      this.assetDragSource(),
      this.assetDragSelection()
    );
  }
}

@Directive({
  selector: '[assetFolderDrop]',
  host: {
    '[class.asset-folder-drop--active]': 'hovered() && allowed()',
    '(dragover)': 'over($event)',
    '(dragleave)': 'leave($event)',
    '(drop)': 'drop($event)',
  },
})
export class AssetFolderDrop {
  private readonly session = inject(AssetDragSession);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef);
  readonly assetFolderDrop = input.required<FolderFilter>();
  readonly folderDropDisabled = input(false);
  readonly folderDropPendingIds = input<ReadonlySet<string>>(
    new Set()
  );
  readonly assetMove = output<AssetBatchMove>();
  readonly hovered = signal(false);
  allowed(): boolean {
    const assets = this.session.assets();
    return (
      assets.length > 0 &&
      !this.folderDropDisabled() &&
      this.assetFolderDrop() !== 'all' &&
      assets.every(
        (asset) => !this.folderDropPendingIds().has(asset._id)
      ) &&
      assets.some(
        (asset) => (asset.folderId ?? null) !== this.assetFolderDrop()
      )
    );
  }

  over(event: DragEvent): void {
    event.preventDefault();
    this.hovered.set(this.allowed());
    if (event.dataTransfer)
      event.dataTransfer.dropEffect = this.allowed()
        ? 'move'
        : 'none';
  }
  leave(event: DragEvent): void {
    if (
      !(event.relatedTarget instanceof Node) ||
      !this.element.nativeElement.contains(event.relatedTarget)
    )
      this.hovered.set(false);
  }
  drop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.hovered.set(false);
    const assets = this.session.assets();
    const folderId = this.assetFolderDrop();
    if (this.allowed() && folderId !== 'all')
      this.assetMove.emit({
        assetIds: assets.map((asset) => asset._id),
        folderId,
      });
    this.session.end();
  }
}
