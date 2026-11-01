import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Asset } from '../../models/asset.models';
import { AssetCardVisualComponent } from './asset-card-visual.component';

@Component({
  selector: 'ngx-asset-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetCardVisualComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <article
      class="asset-card"
      [class.asset-card--archived]="asset().archived"
      [class.asset-card--menu-open]="menuTrigger.menuOpen"
      [attr.aria-busy]="pending()"
    >
      <ngx-asset-card-visual [asset]="asset()">
        <button
          class="asset-card__menu-trigger"
          mat-icon-button
          #menuTrigger="matMenuTrigger"
          [matMenuTriggerFor]="actions"
          [attr.aria-label]="'Actions for ' + asset().name"
          [disabled]="pending()"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>
        <div class="asset-card__overlay">
          <div class="asset-card__heading">
            <button
              class="asset-card__name"
              [title]="asset().name"
              (click)="details.emit()"
              [disabled]="pending()"
            >
              {{ asset().name }}
            </button>
            @if (asset().archived) {
              <span class="asset-card__badge">Archived</span>
            }
          </div>
          @if (asset().tags.length) {
            <div class="asset-card__tags">
              @for (tag of asset().tags.slice(0, 3); track $index) {
                <span class="asset-card__tag">{{ tag }}</span>
              }
              @if (asset().tags.length > 3) {
                <span class="asset-card__tag"
                  >+{{ asset().tags.length - 3 }}</span
                >
              }
            </div>
          }
        </div>
      </ngx-asset-card-visual>
      <mat-menu #actions="matMenu" class="ngx-design-system-overlay">
        <button mat-menu-item (click)="details.emit()">
          <mat-icon>info</mat-icon>View details
        </button>
        <button mat-menu-item (click)="edit.emit()">
          <mat-icon>edit</mat-icon>Edit / move asset
        </button>
        <button mat-menu-item (click)="archive.emit()">
          <mat-icon>{{
            asset().archived ? 'unarchive' : 'archive'
          }}</mat-icon>
          {{ asset().archived ? 'Restore' : 'Archive' }}
        </button>
        <button mat-menu-item (click)="remove.emit()">
          <mat-icon>delete_outline</mat-icon>Delete permanently
        </button>
      </mat-menu>
    </article>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .asset-card {
      overflow: hidden;
      border: 1px solid var(--ngx-color-border);
      border-radius: var(--ngx-radius);
      background: var(--ngx-color-surface);
    }
    .asset-card__menu-trigger {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 2;
      opacity: 0;
      pointer-events: none;
    }
    .asset-card__overlay {
      position: absolute;
      inset: auto 0 0;
      box-sizing: border-box;
      max-height: 100%;
      overflow: auto;
      padding: 6px 8px;
      background: color-mix(
        in srgb,
        var(--ngx-color-canvas) 68%,
        transparent
      );
      color: var(--ngx-color-text);
      opacity: 0;
      pointer-events: none;
    }
    .asset-card:hover .asset-card__overlay,
    .asset-card:focus-within .asset-card__overlay,
    .asset-card--menu-open .asset-card__overlay,
    .asset-card:hover .asset-card__menu-trigger,
    .asset-card:focus-within .asset-card__menu-trigger,
    .asset-card--menu-open .asset-card__menu-trigger {
      opacity: 1;
      pointer-events: auto;
    }
    .asset-card__heading {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .asset-card__name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: 600 0.75rem/1.6 var(--ngx-font-body);
      text-align: left;
      cursor: pointer;
    }
    .asset-card__name:hover {
      text-decoration: underline;
    }
    .asset-card__name:focus-visible {
      outline: 2px solid var(--ngx-color-primary);
      outline-offset: -2px;
    }
    .asset-card__badge,
    .asset-card__tag {
      padding: 2px 4px;
      border-radius: var(--ngx-radius);
      background: color-mix(
        in srgb,
        var(--ngx-color-surface) 70%,
        transparent
      );
      font-size: 0.625rem;
      overflow-wrap: anywhere;
    }
    .asset-card__badge {
      flex-shrink: 0;
    }
    .asset-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    .asset-card__tag {
      max-width: 100%;
    }
    @media (hover: none) {
      .asset-card__overlay,
      .asset-card__menu-trigger {
        opacity: 1;
        pointer-events: auto;
      }
    }
  `,
})
export class AssetCardComponent {
  readonly asset = input.required<Asset>();
  readonly folderName = input('Root');
  readonly pending = input(false);
  readonly details = output<void>();
  readonly edit = output<void>();
  readonly archive = output<void>();
  readonly remove = output<void>();
}
