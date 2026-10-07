import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Folder } from '../../models/asset.models';
import { FolderFilter } from '../../models/asset-manager.models';

@Component({
  selector: 'ngx-asset-folder-browser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <section
      class="asset-folders"
      aria-label="Folder management"
      [attr.aria-busy]="loading()"
    >
      <mat-form-field appearance="outline">
        <mat-label>Browse folder</mat-label>
        <mat-select
          [value]="selected()"
          [canSelectNullableOptions]="true"
          (selectionChange)="selectionChange.emit($event.value)"
        >
          <mat-option value="all">All folders</mat-option>
          <mat-option [value]="null">Root</mat-option>
          @for (folder of folders(); track folder._id) {
            <mat-option [value]="folder._id">{{
              folder.name
            }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <div class="asset-folders__actions">
        <button
          mat-stroked-button
          (click)="create.emit()"
          [disabled]="loading()"
        >
          New folder
        </button>
        <button
          mat-button
          (click)="refresh.emit()"
          [disabled]="loading()"
        >
          Refresh folders
        </button>
        @if (selectedFolder(); as folder) {
          <button
            mat-button
            (click)="rename.emit(folder)"
            [disabled]="loading()"
          >
            Rename folder
          </button>
          <button
            mat-button
            (click)="remove.emit(folder)"
            [disabled]="loading()"
          >
            Delete folder
          </button>
        }
      </div>
      @if (loading()) {
        <p role="status">Loading folders...</p>
      }
      @if (error()) {
        <p class="asset-folders__error" role="alert">
          {{ error() }} Use Refresh folders to retry.
        </p>
      }
    </section>
  `,
  styles: `
    .asset-folders {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .asset-folders__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .asset-folders__error {
      color: var(--mat-sys-error, #b3261e);
    }
    .asset-folders p {
      flex-basis: 100%;
      margin: 0;
    }
    @media (max-width: 720px) {
      .asset-folders mat-form-field {
        width: 100%;
      }
    }
  `,
})
export class AssetFolderBrowserComponent {
  readonly folders = input.required<readonly Folder[]>();
  readonly selected = input<FolderFilter>('all');
  readonly loading = input(false);
  readonly error = input('');
  readonly selectedFolder = computed(() =>
    this.folders().find((folder) => folder._id === this.selected())
  );
  readonly selectionChange = output<FolderFilter>();
  readonly create = output<void>();
  readonly refresh = output<void>();
  readonly rename = output<Folder>();
  readonly remove = output<Folder>();
}
