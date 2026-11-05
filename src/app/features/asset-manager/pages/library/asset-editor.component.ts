import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
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
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { AssetManagerStore } from '../../state/asset-manager.store';
import { Asset, Folder } from '../../models/asset.models';
import { assetError } from '../../utils/asset-utils';
import { assetForm, metadata } from '../../forms/asset-form';

@Component({
  selector: 'ngx-asset-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxButton,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title class="asset-editor__title">
      {{ data.asset ? 'Edit asset' : 'Create asset record' }}
    </h2>
    <mat-dialog-content class="asset-editor">
      <form
        class="asset-editor__form"
        [formGroup]="form"
        (ngSubmit)="save()"
        id="asset-editor-form"
      >
        <mat-form-field
          class="asset-editor__field"
          appearance="outline"
        >
          <mat-label>Folder</mat-label>
          <mat-select panelClass="ngx-design-system-overlay ngx-select-panel"
            formControlName="folderId"
            [canSelectNullableOptions]="true"
          >
            <mat-option [value]="null">Root</mat-option>
            @for (folder of data.folders ?? []; track folder._id) {
              <mat-option [value]="folder._id">{{
                folder.name
              }}</mat-option>
            }
            @if (missingFolderId) {
              <mat-option [value]="missingFolderId" disabled>
                Unavailable folder ({{ missingFolderId }})
              </mat-option>
            }
          </mat-select>
          <mat-hint
            >Moving an asset does not change its stored URL.</mat-hint
          >
        </mat-form-field>
        <mat-form-field
          class="asset-editor__field"
          appearance="outline"
          ><mat-label>Name</mat-label>
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
      </form>
      @if (error()) {
        <p class="asset-editor__error" role="alert">{{ error() }}</p>
      }
      @if (busy()) {
        <mat-progress-bar
          class="asset-editor__progress"
          mode="indeterminate"
        />
        <p class="asset-editor__status" role="status">
          Saving…
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"
      ><button mat-button ngxButton surface="outline" (click)="ref.close()" [disabled]="busy()">
        Cancel
      </button>
      <button
        mat-flat-button ngxButton
        type="submit"
        form="asset-editor-form"
        [disabled]="
          busy() || form.invalid
        "
      >
        Save asset
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .asset-editor__field {
        display: block;
        margin-top: 16px;
      }

      .asset-editor__error {
        color: var(--ngx-color-error);
      }
    `,
  ],
})
export class AssetEditorComponent {
  readonly data = inject<{
    asset?: Asset;
    folders?: readonly Folder[];
    folderId?: string | null;
  }>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<AssetEditorComponent, Asset>);
  private readonly store = inject(AssetManagerStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = assetForm(
    this.data.asset,
    false,
    this.data.folderId
  );
  readonly missingFolderId =
    this.data.asset?.folderId &&
    !this.data.folders?.some(
      (folder) => folder._id === this.data.asset?.folderId
    )
      ? this.data.asset.folderId
      : null;
  readonly busy = signal(false);
  readonly error = signal('');
  save(): void {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error.set('');
    this.busy.set(true);
    this.form.disable();
    this.ref.disableClose = true;
    const done = () => {
      this.busy.set(false);
      this.form.enable();
      this.ref.disableClose = false;
    };
    const request = this.store.saveAsset(
      metadata(this.form),
      this.data.asset?._id
    );
    request
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(done))
      .subscribe({
        next: (asset) => this.ref.close(asset),
        error: (error) =>
          this.error.set(assetError(error, 'asset-save')),
      });
  }
}
