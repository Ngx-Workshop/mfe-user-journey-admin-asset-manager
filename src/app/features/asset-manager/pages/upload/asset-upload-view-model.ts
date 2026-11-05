import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { assetForm } from '../../forms/asset-form';
import { AssetManagerStore } from '../../state/asset-manager.store';
import { assetError, fileError } from '../../utils/asset-utils';

@Injectable()
export class AssetUploadViewModel {
  readonly store = inject(AssetManagerStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = assetForm(undefined, true,
    this.route.snapshot.queryParamMap.get('folderId'));
  readonly busy = signal(false);
  readonly file = signal<File | null>(null);
  readonly error = signal('');
  readonly progress = signal<number | null>(null);

  constructor() {
    this.store.refreshFolders();
  }

  choose(file: File | null): void {
    if (this.busy()) return;
    const error = file ? fileError(file) : 'Choose one file at a time.';
    this.error.set(error ?? '');
    this.file.set(error ? null : file);
  }

  back(): void {
    if (!this.busy()) void this.router.navigate(['..'], { relativeTo: this.route });
  }

  save(): void {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.file()) return;
    this.error.set('');
    this.progress.set(null);
    this.busy.set(true);
    this.form.disable();
    const values = this.form.getRawValue();
    this.store.upload(this.file()!, values.name, values.description, values.folderId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
        this.busy.set(false);
        this.form.enable();
      }))
      .subscribe({
        next: (event) => {
          if (event.kind === 'progress') this.progress.set(event.percent);
          if (event.kind === 'complete') {
            this.busy.set(false);
            this.back();
          }
        },
        error: (error) => this.error.set(assetError(error, 'upload')),
      });
  }
}
