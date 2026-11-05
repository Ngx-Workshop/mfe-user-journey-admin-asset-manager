import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
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
    <div class="asset-file-input__dropzone"
      [class.asset-file-input__dropzone--active]="dragging()"
      [class.asset-file-input__dropzone--disabled]="disabled()"
      (dragover)="dragOver($event)" (dragleave)="dragLeave($event)" (drop)="drop($event)">
    <p id="asset-file-guidance">Drop one file here or choose a file below.</p>
    <label class="asset-file-input__file-label" for="asset-file">
      Choose file
    </label>
    <input
      class="asset-file-input__file-input"
      id="asset-file"
      type="file"
      aria-describedby="asset-file-guidance"
      (change)="pick($event)"
      [disabled]="disabled()"
    />
    </div>
    @if (file()) {
      <p class="asset-file-input__file-summary" role="status">
        {{ file()!.name }} · {{ bytes(file()!.size) }}
      </p>
    }
  `,
  styles: `
    :host { display: block; }
    .asset-file-input__dropzone {
      padding: var(--ngx-space-4);
      border: 2px dashed var(--ngx-color-border);
      border-radius: var(--ngx-radius);
      background: var(--ngx-color-surface);
      color: var(--ngx-color-text);
    }
    .asset-file-input__dropzone--active {
      border-color: var(--ngx-color-primary);
      background: var(--ngx-color-canvas);
    }
    .asset-file-input__dropzone--disabled { opacity: 0.5; }
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
  readonly choose = output<File | null>();
  readonly dragging = signal(false);

  pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.disabled() && input.files?.length) {
      this.choose.emit(input.files.length === 1 ? input.files[0] : null);
    }
  }

  dragOver(event: DragEvent): void {
    event.preventDefault();
    const acceptsFiles = event.dataTransfer?.types.includes('Files') ?? false;
    this.dragging.set(!this.disabled() && acceptsFiles);
    if (event.dataTransfer) event.dataTransfer.dropEffect = this.dragging() ? 'copy' : 'none';
  }

  dragLeave(event: DragEvent): void {
    if (!(event.relatedTarget instanceof Node) ||
      !(event.currentTarget as HTMLElement).contains(event.relatedTarget)) {
      this.dragging.set(false);
    }
  }

  drop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    if (this.disabled()) return;
    const files = event.dataTransfer?.files;
    if (files?.length) this.choose.emit(files.length === 1 ? files[0] : null);
  }
  readonly bytes = formatBytes;
}
