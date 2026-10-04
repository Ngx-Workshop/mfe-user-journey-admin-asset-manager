import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Asset } from '../services/asset-api.service';
import { AssetCardComponent } from './asset-card.component';
import { AssetLibraryResultsViewModel } from './asset-library.models';

@Component({
  selector: 'ngx-asset-library-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetCardComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    @let vm = viewModel();
    @if (vm.notice) {
      <p class="asset-results__notice" role="status">
        {{ vm.notice }}
      </p>
    }
    @if (vm.error) {
      <div class="asset-results__error" role="alert">
        <span>{{ vm.error }}</span>
        <button
          mat-button
          (click)="refresh.emit()"
          [disabled]="vm.loading"
        >
          Retry loading
        </button>
      </div>
    }
    @if (vm.loading) {
      <mat-progress-bar
        mode="indeterminate"
        aria-label="Loading assets"
      />
      <p class="asset-results__loading" role="status">
        Loading your library…
      </p>
    } @else if (!vm.error || vm.totalAssets > 0) {
      <p class="asset-results__count">
        {{ vm.assets.length }}
        {{ vm.assets.length === 1 ? 'asset' : 'assets' }}
      </p>
      @if (vm.assets.length) {
        <div class="asset-results__grid">
          @for (asset of vm.assets; track asset._id) {
            <ngx-asset-card
              [asset]="asset"
              [pending]="vm.pendingIds.has(asset._id)"
              (details)="showDetails.emit(asset)"
              (edit)="edit.emit(asset)"
              (archive)="archive.emit(asset)"
              (remove)="remove.emit(asset)"
            />
          }
        </div>
      } @else {
        <div class="asset-results__empty">
          <mat-icon class="asset-results__empty-icon">
            folder_open
          </mat-icon>
          <h3>
            {{
              vm.totalAssets
                ? 'No matching assets'
                : 'Your library starts here'
            }}
          </h3>
          <p>
            {{
              vm.totalAssets
                ? 'Try another search or adjust your filters.'
                : 'Upload a file or create your first asset record.'
            }}
          </p>
          @if (vm.totalAssets) {
            <button mat-stroked-button (click)="resetFilters.emit()">
              Reset filters
            </button>
          } @else {
            <button mat-flat-button (click)="upload.emit()">
              Upload file
            </button>
          }
        </div>
      }
    }
  `,
  styles: `
    .asset-results__notice {
      color: var(--mat-sys-primary, #6750a4);
      font-size: 0.8125rem;
    }

    .asset-results__error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      color: var(--mat-sys-error, #b3261e);
      background: var(--mat-sys-error-container, #fce8e6);
    }

    .asset-results__loading {
      font-size: 0.8125rem;
      opacity: 0.6;
    }

    .asset-results__count {
      margin: 0 0 1rem;
      font-size: 0.75rem;
      opacity: 0.6;
    }

    .asset-results__grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.25rem;
    }

    .asset-results__empty {
      padding: 3.75rem 1.25rem;
      text-align: center;
    }

    .asset-results__empty-icon {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 3.5rem;
      opacity: 0.4;
    }

    .asset-results__empty p {
      font-size: 0.875rem;
      opacity: 0.65;
    }

    @media (max-width: 1100px) {
      .asset-results__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 720px) {
      .asset-results__grid {
        grid-template-columns: 1fr;
      }

      .asset-results__error {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `,
})
export class AssetLibraryResultsComponent {
  readonly viewModel =
    input.required<AssetLibraryResultsViewModel>();
  readonly refresh = output<void>();
  readonly resetFilters = output<void>();
  readonly upload = output<void>();
  readonly showDetails = output<Asset>();
  readonly edit = output<Asset>();
  readonly archive = output<Asset>();
  readonly remove = output<Asset>();
}
