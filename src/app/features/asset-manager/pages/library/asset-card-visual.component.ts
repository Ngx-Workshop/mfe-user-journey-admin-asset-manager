import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Asset } from '../../models/asset.models';
import { mediaCategory } from '../../utils/asset-manager.utils';

@Component({
  selector: 'ngx-asset-card-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
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
      <ng-content />
    </div>
  `,
  styles: `
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
  `,
})
export class AssetCardVisualComponent {
  readonly asset = input.required<Asset>();
  readonly category = computed(() => mediaCategory(this.asset()));
  readonly previewUrl = computed(() => {
    const asset = this.asset();
    return mediaCategory(asset) === 'image' && asset.storageUrl
      ? asset.storageUrl
      : null;
  });
  readonly icon = computed(
    () =>
      ({
        image: 'image',
        video: 'movie',
        audio: 'music_note',
        document: 'description',
        record: 'inventory_2',
      })[this.category()]
  );
}
