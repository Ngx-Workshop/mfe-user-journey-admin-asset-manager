import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'ngx-asset-selection-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCheckboxModule],
  template: `
    <div class="asset-selection" aria-label="Asset selection">
      <div class="asset-selection__row">
        <mat-checkbox
          aria-label="Select all visible assets"
          [checked]="allSelected()"
          [indeterminate]="selectedCount() > 0 && !allSelected()"
          [disabled]="busy() || !selectableCount()"
          (change)="selectAll.emit($event.checked)"
        >
          Select all
        </mat-checkbox>
        <span role="status">{{ selectedCount() }} selected</span>
      </div>
      <button
        type="button"
        class="asset-selection__clear"
        [disabled]="!selectedCount() || busy()"
        (click)="clear.emit()"
      >
        Clear selection
      </button>
    </div>
  `,
  styles: `
    @use '@angular/material' as mat;
    :host {
      display: block;
      min-width: 0;
      @include mat.checkbox-overrides(
        (
          label-text-size: 0.75rem,
        )
      );
    }
    .asset-selection {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.75rem;
    }
    .asset-selection__row {
      display: flex;
      align-items: center;
      gap: var(--ngx-space-2);
      white-space: nowrap;
    }
    .asset-selection__row span {
      color: var(--ngx-color-muted);
    }
    .asset-selection__clear {
      border: 0;
      padding: 2px 0;
      background: transparent;
      color: var(--ngx-color-primary);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
      font: inherit;
    }
    .asset-selection__clear:disabled {
      color: var(--ngx-color-muted);
      cursor: default;
      opacity: 0.6;
    }
    .asset-selection__clear:focus-visible {
      outline: 2px solid var(--ngx-color-primary);
      outline-offset: 2px;
    }
  `,
})
export class AssetSelectionToolbarComponent {
  readonly selectedCount = input(0);
  readonly selectableCount = input(0);
  readonly allSelected = input(false);
  readonly busy = input(false);
  readonly selectAll = output<boolean>();
  readonly clear = output<void>();
}
