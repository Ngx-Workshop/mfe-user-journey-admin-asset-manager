import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ngx-asset-manager-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="asset-summary" aria-label="Library overview">
      <article class="asset-summary__item">
        <mat-icon class="asset-summary__icon">inventory_2</mat-icon>
        <span>
          <strong class="asset-summary__value">{{ total() }}</strong>
          <small class="asset-summary__label">Total assets</small>
        </span>
      </article>
      <article class="asset-summary__item">
        <mat-icon class="asset-summary__icon">check_circle</mat-icon>
        <span>
          <strong class="asset-summary__value">{{ active() }}</strong>
          <small class="asset-summary__label">Active assets</small>
        </span>
      </article>
      <article class="asset-summary__item">
        <mat-icon class="asset-summary__icon">cloud_done</mat-icon>
        <span>
          <strong class="asset-summary__value">{{ received() }}</strong>
          <small class="asset-summary__label">Stored assets</small>
        </span>
      </article>
      <article class="asset-summary__item">
        <mat-icon class="asset-summary__icon">archive</mat-icon>
        <span>
          <strong class="asset-summary__value">{{ archived() }}</strong>
          <small class="asset-summary__label">Archived</small>
        </span>
      </article>
    </section>
  `,
  styles: `
    .asset-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .asset-summary__item {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1.375rem;
      border: 1px solid var(--mat-sys-outline-variant, #e4e4eb);
      border-radius: 0.875rem;
      background: var(--mat-sys-surface-container-low, #faf9fc);
    }

    .asset-summary__icon {
      box-sizing: content-box;
      padding: 0.75rem;
      border-radius: 0.75rem;
      color: var(--mat-sys-primary, #6750a4);
      background: var(--mat-sys-secondary-container, #eee9f5);
    }

    .asset-summary__value,
    .asset-summary__label {
      display: block;
    }

    .asset-summary__value {
      font-size: 1.625rem;
      font-weight: 600;
    }

    .asset-summary__label {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      opacity: 0.65;
    }

    @media (max-width: 1100px) {
      .asset-summary__item {
        gap: 0.625rem;
        padding: 1rem;
      }

      .asset-summary__icon {
        padding: 0.5rem;
      }
    }

    @media (max-width: 720px) {
      .asset-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.625rem;
      }
    }
  `,
})
export class AssetManagerSummaryComponent {
  readonly total = input.required<number>();
  readonly active = input.required<number>();
  readonly received = input.required<number>();
  readonly archived = input.required<number>();
}
