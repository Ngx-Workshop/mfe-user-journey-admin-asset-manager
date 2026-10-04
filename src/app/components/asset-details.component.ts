import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { Asset, formatBytes } from '../services/asset-api.service';
@Component({
  selector: 'ngx-asset-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ asset.name }}</h2>
    <mat-dialog-content>
      <p>{{ asset.description || 'No description' }}</p>
      <dl>
        <dt>Asset ID</dt>
        <dd>{{ asset._id }}</dd>
        <dt>Storage</dt>
        <dd>
          {{
            asset.storageStatus === 'PENDING_STORAGE'
              ? 'Pending storage'
              : 'Awaiting upload'
          }}
        </dd>
        <dt>Visibility</dt>
        <dd>{{ asset.archived ? 'Archived' : 'Active' }}</dd>
        <dt>Original filename</dt>
        <dd>{{ asset.originalFilename || 'No file received' }}</dd>
        <dt>Media type</dt>
        <dd>{{ asset.mediaType || '—' }}</dd>
        <dt>Size</dt>
        <dd>{{ bytes(asset.sizeBytes) }}</dd>
        <dt>Tags</dt>
        <dd>{{ asset.tags.join(', ') || '—' }}</dd>
        <dt>SHA-256</dt>
        <dd class="checksum">{{ asset.checksumSha256 || '—' }}</dd>
        <dt>Version</dt>
        <dd>{{ asset.version }}</dd>
        <dt>Created</dt>
        <dd>{{ asset.createdAt | date : 'medium' }}</dd>
        <dt>Updated</dt>
        <dd>{{ asset.updatedAt | date : 'medium' }}</dd>
        <dt>Received</dt>
        <dd>{{ (asset.receivedAt | date : 'medium') || '—' }}</dd>
      </dl>
      <p>
        File receipt records metadata. Durable storage, preview and
        download are not yet available.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end"
      ><button mat-button mat-dialog-close>
        Close
      </button></mat-dialog-actions
    >
  `,
  styles: [
    `
      dl {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr);
        gap: 12px;
      }
      dt {
        opacity: 0.7;
      }
      dd {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .checksum {
        font-family: monospace;
      }
      @media (max-width: 480px) {
        dl {
          grid-template-columns: 1fr;
          gap: 6px;
        }
        dd {
          margin-bottom: 10px;
        }
      }
    `,
  ],
})
export class AssetDetailsComponent {
  readonly asset = inject<Asset>(MAT_DIALOG_DATA);
  readonly bytes = formatBytes;
}
@Component({
  selector: 'ngx-delete-asset',
  imports: [MatDialogModule, MatButtonModule],
  template: `<h2 mat-dialog-title>Delete asset?</h2>
    <mat-dialog-content>
      <p>
        Permanently delete “{{ asset.name }}” and its metadata? This
        cannot be undone.
      </p>
      <p>
        Archive the asset instead if you may need it later.
      </p> </mat-dialog-content
    ><mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-flat-button [mat-dialog-close]="true">
        Delete permanently
      </button>
    </mat-dialog-actions>`,
})
export class DeleteAssetComponent {
  readonly asset = inject<Asset>(MAT_DIALOG_DATA);
}
