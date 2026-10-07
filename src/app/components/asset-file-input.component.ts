import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { formatBytes } from '../services/asset-utils';

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
    .asset-file-input__file-input { max-width: 100%; margin: 12px 0; }
    .asset-file-input__file-label { display: block; font-weight: 500; }
  `,
})
export class AssetFileInputComponent {
  readonly file = input<File | null>(null);
  readonly disabled = input(false);
  readonly choose = output<Event>();
  readonly bytes = formatBytes;
}
