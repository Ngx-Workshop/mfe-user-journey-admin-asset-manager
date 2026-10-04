import { DatePipe } from '@angular/common';
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
import { Asset, formatBytes } from '../services/asset-api.service';
import { mediaCategory } from './asset-manager.utils';

@Component({
  selector: 'ngx-asset-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <article
      class="asset-card"
      [class.asset-card--archived]="asset().archived"
      [attr.aria-busy]="pending()"
    >
      <div
        class="asset-card__visual"
        [class.asset-card__visual--image]="category() === 'image'"
      >
        @if (previewUrl()) {
        <img
          class="asset-card__preview"
          [src]="previewUrl()"
          [alt]="asset().name"
        />
        } @else {
        <mat-icon class="asset-card__type-icon">{{
          icon()
        }}</mat-icon>
        <span class="asset-card__media-type">
          {{ asset().mediaType || 'METADATA RECORD' }}
        </span>
        }
        <button
          class="asset-card__menu-trigger"
          mat-icon-button
          [matMenuTriggerFor]="actions"
          [attr.aria-label]="'Actions for ' + asset().name"
          [disabled]="pending()"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>
      </div>
      <div class="asset-card__body">
        <div class="asset-card__heading">
          <button
            class="asset-card__name"
            (click)="details.emit()"
            [disabled]="pending()"
          >
            {{ asset().name }}
          </button>
          @if (asset().archived) {
          <span class="asset-card__badge">Archived</span>
          }
        </div>
        <p class="asset-card__description">
          {{
            asset().description ||
              asset().originalFilename ||
              'Add a description to this asset record.'
          }}
        </p>
        <div class="asset-card__tags">
          @for (tag of asset().tags.slice(0, 3); track $index) {
          <span class="asset-card__tag">{{ tag }}</span>
          } @if (asset().tags.length > 3) {
          <span class="asset-card__tag">
            +{{ asset().tags.length - 3 }}
          </span>
          }
        </div>
        <div class="asset-card__footer">
          <span class="asset-card__storage">
            <i
              class="asset-card__status"
              [class.asset-card__status--ready]="
                asset().storageStatus === 'READY'
              "
              [class.asset-card__status--failed]="
                asset().storageStatus === 'STORAGE_FAILED'
              "
            ></i>
            {{ storageLabel() }}
          </span>
          <span>{{ bytes(asset().sizeBytes) }}</span>
        </div>
        <p class="asset-card__date">
          Updated {{ asset().updatedAt | date : 'mediumDate' }}
        </p>
      </div>
      <mat-menu #actions="matMenu">
        <button mat-menu-item (click)="details.emit()">
          <mat-icon>info</mat-icon>
          View details
        </button>
        <button mat-menu-item (click)="edit.emit()">
          <mat-icon>edit</mat-icon>
          Edit metadata
        </button>
        <button mat-menu-item (click)="archive.emit()">
          <mat-icon>
            {{ asset().archived ? 'unarchive' : 'archive' }}
          </mat-icon>
          {{ asset().archived ? 'Restore' : 'Archive' }}
        </button>
        <button mat-menu-item (click)="remove.emit()">
          <mat-icon>delete_outline</mat-icon>
          Delete permanently
        </button>
      </mat-menu>
    </article>
  `,
  styles: `
    .asset-card {
      overflow: hidden;
      border: 1px solid var(--mat-sys-outline-variant, #e4e4eb);
      border-radius: 0.75rem;
    }

    .asset-card__visual {
      position: relative;
      display: flex;
      min-height: 8.75rem;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      background: var(--mat-sys-surface-container, #f1eff6);
    }

    .asset-card__visual--image {
      background: var(--mat-sys-primary-container, #eaddff);
    }

    .asset-card__type-icon {
      width: 2.625rem;
      height: 2.625rem;
      color: var(--mat-sys-primary, #6750a4);
      font-size: 2.625rem;
      opacity: 0.8;
    }

    .asset-card__preview {
      width: 100%;
      min-height: 8.75rem;
      max-height: 8rem;
      object-fit: cover;
    }

    .asset-card__media-type {
      max-width: 80%;
      overflow-wrap: anywhere;
      font-size: 0.625rem;
      letter-spacing: 0.0625rem;
      text-align: center;
      opacity: 0.55;
    }

    .asset-card__menu-trigger {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    .asset-card__body {
      padding: 1.125rem;
    }

    .asset-card__heading,
    .asset-card__footer,
    .asset-card__storage {
      display: flex;
      align-items: center;
    }

    .asset-card__heading {
      gap: 0.5rem;
    }

    .asset-card__name {
      overflow-wrap: anywhere;
      padding: 0;
      border: 0;
      color: inherit;
      background: none;
      font: inherit;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
    }

    .asset-card__name:hover {
      text-decoration: underline;
    }

    .asset-card__name:focus-visible {
      outline: 2px solid var(--mat-sys-primary, #6750a4);
      outline-offset: 0.25rem;
    }

    .asset-card__badge,
    .asset-card__tag {
      padding: 0.25rem 0.4375rem;
      border-radius: 0.3125rem;
      background: var(--mat-sys-surface-container, #f1eff6);
      font-size: 0.625rem;
    }

    .asset-card__description {
      display: -webkit-box;
      min-height: 2.375rem;
      overflow: hidden;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      font-size: 0.75rem;
      line-height: 1.6;
      opacity: 0.65;
    }

    .asset-card__tags {
      display: flex;
      min-height: 1.5rem;
      flex-wrap: wrap;
      gap: 0.3125rem;
      margin-bottom: 1rem;
    }

    .asset-card__tag {
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .asset-card__footer {
      justify-content: space-between;
      gap: 0.5rem;
      padding-top: 0.875rem;
      border-top: 1px solid var(--mat-sys-outline-variant, #e4e4eb);
      font-size: 0.6875rem;
    }

    .asset-card__storage {
      gap: 0.375rem;
    }

    .asset-card__status {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 50%;
      background: #858391;
    }

    .asset-card__status--ready {
      background: #2e7d32;
    }

    .asset-card__status--failed {
      background: var(--mat-sys-error, #b3261e);
    }

    .asset-card__date {
      margin: 0.625rem 0 0;
      font-size: 0.625rem;
      opacity: 0.5;
    }
  `,
})
export class AssetCardComponent {
  readonly asset = input.required<Asset>();
  readonly pending = input(false);
  readonly details = output<void>();
  readonly edit = output<void>();
  readonly archive = output<void>();
  readonly remove = output<void>();
  readonly bytes = formatBytes;
  readonly category = computed(() => mediaCategory(this.asset()));
  readonly previewUrl = computed(() => {
    const asset = this.asset();
    return mediaCategory(asset) === 'image' && asset.storageUrl
      ? asset.storageUrl
      : null;
  });
  readonly storageLabel = computed(
    () =>
      ({
        READY: 'Stored',
        PENDING_STORAGE: 'Processing storage',
        STORAGE_FAILED: 'Storage failed',
        AWAITING_UPLOAD: 'Storage unavailable',
      }[this.asset().storageStatus])
  );
  readonly icon = computed(
    () =>
      ({
        image: 'image',
        video: 'movie',
        audio: 'music_note',
        document: 'description',
        record: 'inventory_2',
      }[this.category()])
  );
}
