import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { formatBytes } from '../../utils/asset-utils';

@Component({
  selector: 'ngx-asset-file-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="asset-file-input__guidance">
      Upload a file up to 25 MiB. Stored images are available for
      preview in the library. Identical content is rejected across all
      folders, including archived assets.
    </p>
    <label class="asset-file-input__file-label" for="asset-file">
      Choose file
    </label>
    <input
      class="asset-file-input__file-input"
      id="asset-file"
      type="file"
      (change)="choose.emit($event)"
      [disabled]="disabled()"
    />
    @if (file()) {
      <p class="asset-file-input__file-summary">
        {{ file()!.name }} · {{ bytes(file()!.size) }}
      </p>
    }
  `,
  styles: `
    :host { display: block; }
    .asset-file-input__guidance,
    .asset-file-input__file-summary {
      color: var(--ngx-color-muted);
      overflow-wrap: anywhere;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    .asset-file-input__file-input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      margin: 12px 0;
      padding: var(--ngx-space-2);
      border: 1px dashed var(--ngx-color-border);
      border-radius: var(--ngx-radius);
      background: var(--ngx-color-surface);
      color: var(--ngx-color-text);
      font: inherit;
    }
    .asset-file-input__file-input::file-selector-button {
      padding: var(--ngx-space-2);
      margin-right: var(--ngx-space-2);
      border: 1px solid var(--ngx-color-primary);
      border-radius: var(--ngx-radius);
      background: var(--ngx-color-canvas);
      color: var(--ngx-color-primary);
      font-family: var(--ngx-font-mono);
      cursor: pointer;
    }
    .asset-file-input__file-input:focus-visible {
      outline: 2px solid var(--ngx-color-primary);
      outline-offset: 2px;
    }
    .asset-file-input__file-input:disabled { opacity: 0.5; }
    .asset-file-input__file-label {
      display: block;
      font-weight: 500;
    }
  `,
})
export class AssetFileInputComponent {
  readonly file = input<File | null>(null);
  readonly disabled = input(false);
  readonly choose = output<Event>();
  readonly bytes = formatBytes;
}
