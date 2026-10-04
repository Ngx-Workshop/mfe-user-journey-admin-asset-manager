import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { AssetApiService, assetError } from '../services/asset-api.service';
import { nonblank } from '../services/asset-form';
import { FolderEditorData, FolderResult } from './asset-manager.models';

@Component({
  selector: 'ngx-asset-folder-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.remove ? 'Delete folder?' : data.folder ? 'Rename folder' : 'New folder' }}</h2>
    <mat-dialog-content>
      @if (data.remove) {
        <p>Permanently delete "{{ data.folder.name }}"? This cannot be undone.</p>
        <p>Only empty folders can be deleted. Move or delete all assets first, including archived assets.</p>
      } @else {
        <form id="asset-folder-form" (submit)="submit($event)" novalidate>
          <mat-form-field class="asset-folder-editor__field" appearance="outline">
            <mat-label>Folder name</mat-label>
            <input matInput [formControl]="name" />
            <mat-hint>Folder names must be unique, ignoring case.</mat-hint>
            <mat-error>Enter a nonblank folder name.</mat-error>
          </mat-form-field>
        </form>
      }
      @if (error()) { <p class="asset-folder-editor__error" role="alert">{{ error() }}</p> }
      @if (busy()) { <p role="status">{{ data.remove ? 'Deleting folder...' : 'Saving folder...' }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()" [disabled]="busy()">Cancel</button>
      @if (data.remove) {
        <button mat-flat-button (click)="save()" [disabled]="busy()">Delete folder</button>
      } @else {
        <button mat-flat-button type="submit" form="asset-folder-form" [disabled]="busy() || name.invalid">Save folder</button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .asset-folder-editor__field { display: block; margin-top: 0.5rem; }
    .asset-folder-editor__error { color: var(--mat-sys-error, #b3261e); }
  `,
})
export class AssetFolderEditorComponent {
  readonly data = inject<FolderEditorData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<AssetFolderEditorComponent, FolderResult>);
  private readonly api = inject(AssetApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly name = new FormControl(this.data.folder?.name ?? '', { nonNullable: true, validators: [nonblank] });
  readonly error = signal('');
  readonly busy = signal(false);

  submit(event: SubmitEvent): void {
    event.preventDefault();
    this.save();
  }

  save(): void {
    if (this.busy()) return;
    this.name.markAsTouched();
    if (!this.data.remove && this.name.invalid) return;
    this.busy.set(true);
    this.error.set('');
    this.name.disable();
    this.ref.disableClose = true;
    const done = () => {
      this.busy.set(false);
      this.name.enable();
      this.ref.disableClose = false;
    };
    if (this.data.remove) {
      const id = this.data.folder._id;
      this.api.removeFolder(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(done)).subscribe({
        next: () => this.ref.close({ removed: id }),
        error: (error: unknown) => this.error.set(assetError(error, 'folder-delete')),
      });
    } else {
      const dto = { name: this.name.getRawValue().trim() };
      const request = this.data.folder
        ? this.api.updateFolder(this.data.folder._id, dto)
        : this.api.createFolder(dto);
      request.pipe(takeUntilDestroyed(this.destroyRef), finalize(done)).subscribe({
        next: (saved) => this.ref.close({ saved }),
        error: (error: unknown) => this.error.set(assetError(error, 'folder-save')),
      });
    }
  }
}
