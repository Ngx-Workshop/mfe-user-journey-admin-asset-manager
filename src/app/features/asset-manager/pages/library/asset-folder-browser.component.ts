import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AssetFolderDrop } from './asset-drag-drop';
import { MatTreeModule } from '@angular/material/tree';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import { Folder } from '../../models/asset.models';
import {
  AssetBatchMove,
  FolderFilter,
} from '../../models/asset-manager.models';

interface FolderNode {
  id: FolderFilter;
  name: string;
  children?: FolderNode[];
  folder?: Folder;
}

@Component({
  selector: 'ngx-asset-folder-browser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxButton,
    MatButtonModule,
    MatIconModule,
    MatTreeModule,
    MatMenuModule,
    AssetFolderDrop,
  ],
  template: `
    <section
      class="asset-folders"
      aria-label="Folder management"
      [attr.aria-busy]="loading()"
    >
      <mat-tree
        #tree
        [dataSource]="nodes()"
        [childrenAccessor]="children"
        [expansionKey]="nodeKey"
        [trackBy]="trackNode"
        aria-label="Browse folders"
      >
        <mat-tree-node
          *matTreeNodeDef="let node"
          matTreeNodePadding
          matTreeNodePaddingIndent="16"
          [isExpandable]="node.id === 'all'"
          [isExpanded]="node.id === 'all'"
          [isDisabled]="loading()"
          [assetFolderDrop]="node.id"
          [folderDropDisabled]="loading() || moving()"
          [folderDropPendingIds]="pendingIds()"
          (assetMove)="assetMove.emit($event)"
          [cdkTreeNodeTypeaheadLabel]="node.name"
          [attr.aria-label]="node.name"
          [attr.aria-selected]="selected() === node.id"
          [class.asset-folders__node--selected]="
            selected() === node.id
          "
          (click)="select(node)"
          (activation)="select(node)"
        >
          @if (node.id === 'all') {
            <button
              mat-icon-button
              matTreeNodeToggle
              tabindex="-1"
              [disabled]="loading() || moving()"
              [attr.aria-label]="
                tree.isExpanded(node)
                  ? 'Collapse folders'
                  : 'Expand folders'
              "
              (click)="$event.stopPropagation()"
            >
              <mat-icon>{{
                tree.isExpanded(node)
                  ? 'expand_more'
                  : 'chevron_right'
              }}</mat-icon>
            </button>
          } @else {
            <span class="asset-folders__indent"></span>
          }
          <mat-icon class="asset-folders__icon">{{
            node.id === 'all' ? 'folder_copy' : 'folder'
          }}</mat-icon>
          <span class="asset-folders__name">{{ node.name }}</span>
          <button
            mat-icon-button
            class="asset-folders__menu"
            [class.asset-folders__menu--open]="trigger.menuOpen"
            #trigger="matMenuTrigger"
            [matMenuTriggerFor]="actions"
            [matMenuTriggerData]="{ node: node }"
            [disabled]="loading() || moving()"
            [attr.aria-label]="'Actions for ' + node.name"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <mat-icon>more_horiz</mat-icon>
          </button>
        </mat-tree-node>
      </mat-tree>
      <mat-menu #actions="matMenu" class="ngx-design-system-overlay">
        <ng-template matMenuContent let-node="node">
          <button
            mat-menu-item
            (click)="create.emit()"
            [disabled]="loading() || moving()"
          >
            <mat-icon>create_new_folder</mat-icon>New folder
          </button>
          @if (node.folder; as folder) {
            <button
              mat-menu-item
              (click)="rename.emit(folder)"
              [disabled]="loading() || moving()"
            >
              <mat-icon>edit</mat-icon>Rename folder
            </button>
            <button
              mat-menu-item
              (click)="remove.emit(folder)"
              [disabled]="loading() || moving()"
            >
              <mat-icon>delete_outline</mat-icon>Delete folder
            </button>
          }
        </ng-template>
      </mat-menu>
      @if (loading()) {
        <p role="status">Loading folders...</p>
      }
      @if (error()) {
        <p class="asset-folders__error" role="alert">
          {{ error() }}
          <button
            mat-button
            ngxButton
            surface="outline"
            (click)="refresh.emit()"
          >
            Retry loading folders
          </button>
        </p>
      }
    </section>
  `,
  styles: `
    @use '@angular/material' as mat;
    :host {
      display: block;
      min-width: 0;
      @include mat.icon-button-density(-3);
    }
    .asset-folders {
      display: grid;
      gap: var(--ngx-space-4);
    }
    mat-tree {
      background: transparent;
    }
    mat-tree-node {
      min-height: 40px;
      gap: 4px;
      cursor: pointer;
      color: var(--ngx-color-text);
      border-radius: var(--ngx-radius);
    }
    mat-tree-node:hover {
      background: var(--ngx-color-surface);
    }
    mat-tree-node:focus-visible {
      outline: 2px solid var(--ngx-color-primary);
      outline-offset: -2px;
    }
    .asset-folders__node--selected {
      background: var(--ngx-color-surface);
      box-shadow: inset 2px 0 var(--ngx-color-primary);
    }
    .asset-folders__name {
      overflow-wrap: anywhere;
      min-width: 0;
      font-size: 0.8rem;
      flex: 1;
    }
    .asset-folders__icon {
      flex-shrink: 0;
      color: var(--ngx-color-primary);
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
    .asset-folders__indent {
      width: 8px;
      flex-shrink: 0;
    }
    .asset-folders__menu {
      flex-shrink: 0;
      opacity: 0;
      pointer-events: none;
    }
    mat-tree-node:hover .asset-folders__menu,
    mat-tree-node:focus-within .asset-folders__menu,
    .asset-folders__menu--open {
      opacity: 1;
      pointer-events: auto;
    }
    @media (hover: none) {
      .asset-folders__menu {
        opacity: 1;
        pointer-events: auto;
      }
    }
    .asset-folder-drop--active {
      outline: 2px solid var(--ngx-color-primary);
      outline-offset: -2px;
      background: var(--ngx-color-surface);
    }
    .asset-folders__error {
      color: var(--ngx-color-error);
    }
    p {
      margin: 0;
      font-size: 0.75rem;
    }
  `,
})
export class AssetFolderBrowserComponent {
  readonly folders = input.required<readonly Folder[]>();
  readonly selected = input<FolderFilter>('all');
  readonly loading = input(false);
  readonly moving = input(false);
  readonly error = input('');
  readonly pendingIds = input<ReadonlySet<string>>(new Set());
  readonly assetMove = output<AssetBatchMove>();
  readonly nodes = computed<FolderNode[]>(() => [
    {
      id: 'all',
      name: 'All folders',
      children: [
        { id: null, name: 'Root' },
        ...this.folders().map((folder) => ({
          id: folder._id,
          name: folder.name,
          folder,
        })),
      ],
    },
  ]);
  readonly children = (node: FolderNode) => node.children ?? [];
  readonly nodeKey = (node: FolderNode) =>
    node.id === null
      ? 'root'
      : node.id === 'all'
        ? 'all'
        : 'folder:' + node.id;
  readonly trackNode = (_index: number, node: FolderNode) =>
    this.nodeKey(node);
  readonly selectionChange = output<FolderFilter>();
  readonly create = output<void>();
  readonly refresh = output<void>();
  readonly rename = output<Folder>();
  readonly remove = output<Folder>();
  select(node: FolderNode): void {
    if (!this.loading()) this.selectionChange.emit(node.id);
  }
}
