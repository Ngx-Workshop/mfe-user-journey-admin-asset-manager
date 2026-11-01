import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';

@Component({
  selector: 'ngx-asset-library-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, NgxButton],
  template: `
    <div class="asset-results__empty">
      <mat-icon class="asset-results__empty-icon">
        folder_open
      </mat-icon>
      <h3>
        {{
          totalAssets()
            ? 'No matching assets'
            : 'Your library starts here'
        }}
      </h3>
      <p>
        {{
          totalAssets()
            ? 'Try another search or adjust your filters.'
            : 'Upload a file or create your first asset record.'
        }}
      </p>
      @if (totalAssets()) {
        <button
          mat-stroked-button
          ngxButton
          surface="outline"
          (click)="resetFilters.emit()"
        >
          Reset filters
        </button>
      } @else {
        <button mat-flat-button ngxButton (click)="upload.emit()">
          Upload file
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
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
      color: var(--ngx-color-muted);
    }
  `,
})
export class AssetLibraryEmptyComponent {
  readonly totalAssets = input(0);
  readonly resetFilters = output<void>();
  readonly upload = output<void>();
}
