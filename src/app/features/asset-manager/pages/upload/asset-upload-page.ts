import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { CanDeactivateFn } from '@angular/router';
import { NgxBackground, NgxButton, NgxEntrance, NgxPanel } from '@tmdjr/ngx-workshop-design-system';
import { AssetFileInputComponent } from './asset-file-input.component';
import { AssetUploadViewModel } from './asset-upload-view-model';

@Component({
  selector: 'ngx-asset-upload-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AssetUploadViewModel],
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatProgressBarModule, MatSelectModule, NgxBackground, NgxButton, NgxEntrance,
    NgxPanel, AssetFileInputComponent],
  template: `
    <ngx-background placement="viewport" />
    <ngx-panel ngxEntrance="fade" heading="Upload a file" eyebrow="ASSET LIBRARY"
      shape="stepped" background="glass">
      <ngx-asset-file-input [file]="model.file()" [disabled]="model.busy()"
        (choose)="model.choose($event)" />
      <form id="asset-upload-form" class="asset-upload__form" [formGroup]="model.form"
        (ngSubmit)="model.save()">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Folder</mat-label>
          <mat-select panelClass="ngx-design-system-overlay ngx-select-panel"
            formControlName="folderId" [canSelectNullableOptions]="true">
            <mat-option [value]="null">Root</mat-option>
            @for (folder of model.store.folders(); track folder._id) {
              <mat-option [value]="folder._id">{{ folder.name }}</mat-option>
            }
            @if (missingFolderId) {
              <mat-option [value]="missingFolderId" disabled>
                Unavailable folder ({{ missingFolderId }})
              </mat-option>
            }
          </mat-select>
          <mat-hint>Folders organize assets without changing stored URLs.</mat-hint>
        </mat-form-field>
        @if (model.store.foldersLoading()) {
          <p role="status">Loading folders…</p>
        }
        @if (model.store.foldersError()) {
          <div role="alert" class="asset-upload__error asset-upload__folder-error">
            {{ model.store.foldersError() }}
            <button mat-button ngxButton type="button" [disabled]="model.busy()"
              (click)="model.store.refreshFolders()">Retry loading folders</button>
          </div>
        }
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Display name (optional)</mat-label>
          <input matInput formControlName="name" maxlength="120" />
          <mat-hint>Leave blank to use the filename.</mat-hint>
          <mat-error>Use up to 120 characters.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="2000"></textarea>
          <mat-error>Use up to 2000 characters.</mat-error>
        </mat-form-field>
      </form>
      @if (model.error()) {
        <p class="asset-upload__error" role="alert">{{ model.error() }}</p>
      }
      @if (model.busy()) {
        <mat-progress-bar aria-label="File upload progress"
          [mode]="model.progress() === null ? 'indeterminate' : 'determinate'"
          [value]="model.progress() ?? 0" />
        <p role="status" aria-live="polite">{{ model.progress() === null
          ? 'Receiving file…' : 'Receiving file: ' + model.progress() + '%' }}</p>
      }
      <div ngxPanelActions class="asset-upload__actions">
        <button mat-button ngxButton surface="outline" type="button"
          [disabled]="model.busy()" (click)="model.back()">Cancel</button>
        <button mat-flat-button ngxButton shape="chevron" type="submit" form="asset-upload-form"
          [disabled]="model.busy() || model.form.invalid || !model.file()">
          {{ model.busy() ? 'Uploading…' : 'Upload file' }}
        </button>
      </div>
    </ngx-panel>
  `,
  styles: `
    :host {
      position: relative;
      isolation: isolate;
      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: 765px;
      min-width: 0;
      margin-inline: auto;
      padding: var(--ngx-space-4);
      color: var(--ngx-color-text);
    }
    .asset-upload__form { display: grid; gap: var(--ngx-space-4); margin-top: var(--ngx-space-4); }
    mat-form-field { width: 100%; min-width: 0; }
    p { color: var(--ngx-color-muted); }
    .asset-upload__error { color: var(--ngx-color-error); overflow-wrap: anywhere; }
    .asset-upload__folder-error { display: grid; justify-items: start; gap: var(--ngx-space-2); }
    .asset-upload__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ngx-space-2); width: 100%; }
  `,
})
export class AssetUploadPage {
  readonly model = inject(AssetUploadViewModel);

  get missingFolderId(): string | null {
    const id = this.model.form.controls.folderId.value;
    return id && !this.model.store.folders().some(folder => folder._id === id) ? id : null;
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.model.busy()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}

export const canLeaveAssetUpload: CanDeactivateFn<AssetUploadPage> = page => !page.model.busy();
