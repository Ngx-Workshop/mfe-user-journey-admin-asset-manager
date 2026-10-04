import { HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import {
  Asset,
  AssetApiService,
  assetError,
  fileError,
  formatBytes,
} from '../services/asset-api.service';
import { assetForm, metadata } from '../services/asset-form';

@Component({
  selector: 'ngx-asset-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    <h2 mat-dialog-title class="asset-editor__title">
      {{
        data.asset
          ? 'Edit asset'
          : data.upload
          ? 'Upload a file'
          : 'Create asset record'
      }}
    </h2>
    <mat-dialog-content class="asset-editor">
      @if (data.upload) {
      <p class="asset-editor__guidance">
        Receive a file up to 25 MiB. Durable storage is pending; files
        cannot be previewed or downloaded yet.
      </p>
      <label class="asset-editor__file-label" for="asset-file">
        Choose file
      </label>
      <input
        class="asset-editor__file-input"
        id="asset-file"
        type="file"
        (change)="choose($event)"
        [disabled]="busy()"
      />
      @if (file()) {
      <p class="asset-editor__file-summary">
        {{ file()!.name }} · {{ bytes(file()!.size) }}
      </p>
      } }
      <form
        class="asset-editor__form"
        [formGroup]="form"
        (ngSubmit)="save()"
        id="asset-editor-form"
      >
        <mat-form-field
          class="asset-editor__field"
          appearance="outline"
          ><mat-label>{{
            data.upload ? 'Display name (optional)' : 'Name'
          }}</mat-label>
          <input matInput formControlName="name" maxlength="120" />
          <mat-error>Enter a name up to 120 characters.</mat-error>
        </mat-form-field>
        <mat-form-field
          class="asset-editor__field"
          appearance="outline"
          ><mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            maxlength="2000"
          ></textarea>
          <mat-error>Use up to 2000 characters.</mat-error>
        </mat-form-field>
        @if (!data.upload) {
        <mat-form-field
          class="asset-editor__field"
          appearance="outline"
          ><mat-label>Tags</mat-label>
          <input
            matInput
            formControlName="tags"
            placeholder="branding, workshop, course"
          />
          <mat-hint
            >Comma separated · up to 50 tags, 100 characters
            each</mat-hint
          >
          <mat-error
            >Use up to 50 tags of 100 characters each.</mat-error
          >
        </mat-form-field>
        }
      </form>
      @if (error()) {
      <p class="asset-editor__error" role="alert">{{ error() }}</p>
      } @if (busy()) {
      <mat-progress-bar
        class="asset-editor__progress"
        [mode]="progress() === null ? 'indeterminate' : 'determinate'"
        [value]="progress() ?? 0"
      />
      <p class="asset-editor__status" role="status">
        {{
          data.upload
            ? progress() === null
              ? 'Receiving file…'
              : 'Receiving file: ' + progress() + '%'
            : 'Saving…'
        }}
      </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"
      ><button mat-button (click)="ref.close()" [disabled]="busy()">
        Cancel
      </button>
      <button
        mat-flat-button
        type="submit"
        form="asset-editor-form"
        [disabled]="
          busy() || form.invalid || (data.upload && !file())
        "
      >
        {{ data.upload ? 'Upload file' : 'Save asset' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .asset-editor__field {
        display: block;
        margin-top: 16px;
      }

      .asset-editor__file-input {
        max-width: 100%;
        margin: 12px 0;
      }

      .asset-editor__file-label {
        display: block;
        font-weight: 500;
      }

      .asset-editor__error {
        color: var(--mat-sys-error, #b3261e);
      }
    `,
  ],
})
export class AssetEditorComponent {
  readonly data = inject<{ asset?: Asset; upload?: boolean }>(
    MAT_DIALOG_DATA
  );
  readonly ref = inject(MatDialogRef<AssetEditorComponent, Asset>);
  private readonly api = inject(AssetApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = assetForm(this.data.asset, this.data.upload);
  readonly busy = signal(false);
  readonly file = signal<File | null>(null);
  readonly error = signal('');
  readonly progress = signal<number | null>(null);
  readonly bytes = formatBytes;
  choose(event: Event): void {
    const file =
      (event.target as HTMLInputElement).files?.[0] ?? null;
    const error = file ? fileError(file) : null;
    this.error.set(error ?? '');
    this.file.set(error ? null : file);
  }
  save(): void {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || (this.data.upload && !this.file()))
      return;
    this.error.set('');
    this.busy.set(true);
    this.form.disable();
    this.ref.disableClose = true;
    const done = () => {
      this.busy.set(false);
      this.form.enable();
      this.ref.disableClose = false;
    };
    if (this.data.upload) {
      const values = this.form.getRawValue();
      this.api
        .upload(this.file()!, values.name, values.description)
        .pipe(takeUntilDestroyed(this.destroyRef), finalize(done))
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress)
              this.progress.set(
                event.total
                  ? Math.round((event.loaded * 100) / event.total)
                  : null
              );
            if (event.type === HttpEventType.Response && event.body)
              this.ref.close(event.body);
          },
          error: (error) => this.error.set(assetError(error)),
        });
    } else {
      const request = this.data.asset
        ? this.api.update(this.data.asset._id, metadata(this.form))
        : this.api.create(metadata(this.form));
      request
        .pipe(takeUntilDestroyed(this.destroyRef), finalize(done))
        .subscribe({
          next: (asset) => this.ref.close(asset),
          error: (error) => this.error.set(assetError(error)),
        });
    }
  }
}
