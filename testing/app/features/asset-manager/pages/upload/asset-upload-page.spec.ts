import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Routes } from '../../../../../../src/app/app.routes';
import { App } from '../../../../../../src/app/app';
import { AssetManagerComponent } from '../../../../../../src/app/features/asset-manager/pages/library/asset-manager.component';
import { AssetUploadPage } from '../../../../../../src/app/features/asset-manager/pages/upload/asset-upload-page';
import { AssetManagerStore } from '../../../../../../src/app/features/asset-manager/state/asset-manager.store';
import { By } from '@angular/platform-browser';

const folder = { _id: 'brand', name: 'Brand', version: 0, createdAt: '', updatedAt: '' };

describe('Routed asset upload', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideNoopAnimations(),
        provideRouter([{ path: 'admin/assets', children: Routes }])],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => http.verify());

  async function open(query = '?folderId=brand') {
    const page = await harness.navigateByUrl('/admin/assets/upload' + query, AssetUploadPage);
    http.expectOne('/api/uploader/folders').flush([folder]);
    harness.detectChanges();
    return page;
  }
  function drop(files: File[]) {
    harness.detectChanges();
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    const zone = harness.routeNativeElement!.querySelector('.asset-file-input__dropzone')!;
    zone.dispatchEvent(new DragEvent('dragover', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    harness.detectChanges();
    const highlighted = zone.classList.contains('asset-file-input__dropzone--active');
    zone.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    harness.detectChanges();
    return highlighted;
  }
  function flushLibrary() {
    http.expectOne('/api/uploader').flush([]);
    http.expectOne('/api/uploader/folders').flush([folder]);
  }

  it('routes both library upload entry points under the host mount and carries the selected folder', async () => {
    await harness.navigateByUrl('/admin/assets', App);
    flushLibrary();
    harness.detectChanges();
    const manager = harness.routeDebugElement!.query(By.directive(AssetManagerComponent)).componentInstance as AssetManagerComponent;
    manager.store.setFolderFilter(folder._id);
    const button = [...harness.routeNativeElement!.querySelectorAll('button')]
      .find(button => button.textContent?.includes('Upload file'))!;
    button.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/assets/upload?folderId=brand');
    http.expectOne('/api/uploader/folders').flush([folder]);
    await harness.navigateByUrl('/admin/assets', App);
    flushLibrary();
    manager.store.setFolderFilter('all');
    harness.detectChanges();
    const emptyUpload = harness.routeNativeElement!.querySelector('ngx-asset-library-empty button') as HTMLButtonElement;
    expect(emptyUpload).not.toBeNull();
    emptyUpload.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/assets/upload');
    http.expectOne('/api/uploader/folders').flush([folder]);
  });

  it('cancels to the library and supports Root on direct navigation without a folder', async () => {
    const page = await open('');
    expect(page.model.form.controls.folderId.value).toBeNull();
    expect(harness.routeNativeElement!.querySelector('mat-stepper')).toBeNull();
    page.model.back();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/assets');
    flushLibrary();
  });

  it('handles file drops, multi-file and invalid file errors, and native picker selection without submitting', async () => {
    const page = await open();
    const file = new File(['test'], 'logo.svg');
    expect(drop([file])).toBeTrue();
    expect(page.model.file()).toBe(file);
    http.expectNone('/api/uploader/upload');
    drop([file, new File(['other'], 'other.txt')]);
    expect(page.model.file()).toBeNull();
    expect(page.model.error()).toContain('one file');
    drop([new File([], 'empty.txt')]);
    expect(page.model.error()).toContain('nonempty');
    drop([new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'large.bin')]);
    expect(page.model.error()).toContain('25');
    drop([new File(['test'], 'x'.repeat(256))]);
    expect(page.model.error()).toContain('255');
    const input = harness.routeNativeElement!.querySelector('input[type=file]') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    expect(page.model.file()).toBe(file);
    http.expectNone('/api/uploader/upload');
  });

  it('blocks departure, new selection and duplicate submission during upload, shows progress and returns on success', async () => {
    const page = await open();
    const file = new File(['test'], 'file.txt');
    drop([file]);
    page.model.save();
    page.model.save();
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.body.get('folderId')).toBe(folder._id);
    expect(page.model.form.disabled).toBeTrue();
    expect(await TestBed.inject(Router).navigateByUrl('/admin/assets')).toBeFalse();
    expect(TestBed.inject(Router).url).toContain('/upload');
    expect(drop([new File(['other'], 'other.txt')])).toBeFalse();
    expect(page.model.file()).toBe(file);
    const unload = new Event('beforeunload', { cancelable: true });
    page.beforeUnload(unload as BeforeUnloadEvent);
    expect(unload.defaultPrevented).toBeTrue();
    request.event({ type: HttpEventType.UploadProgress, loaded: 2, total: 4 });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('50%');
    const saved = { _id: 'file', name: 'file.txt', tags: [], storageStatus: 'PENDING_STORAGE' };
    request.flush(saved, { status: 202, statusText: 'Accepted' });
    expect(TestBed.inject(AssetManagerStore).assets()).toContain(jasmine.objectContaining({ _id: 'file' }));
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/assets');
    flushLibrary();
  });

  it('retains file and metadata on duplicate/storage failures and resets progress for retry', async () => {
    const page = await open();
    const model = page.model;
    const file = new File(['test'], 'logo.svg');
    model.choose(file);
    model.form.controls.name.setValue('Logo');
    model.form.controls.description.setValue('Brand image');
    model.save();
    const request = http.expectOne('/api/uploader/upload');
    request.event({ type: HttpEventType.UploadProgress, loaded: 4, total: 4 });
    request.flush(null, { status: 409, statusText: 'Conflict' });
    expect(model.error()).toContain('Identical file content');
    expect(model.file()).toBe(file);
    expect(model.form.getRawValue()).toEqual(jasmine.objectContaining({ name: 'Logo', description: 'Brand image', folderId: folder._id }));
    expect(model.form.enabled).toBeTrue();
    model.save();
    expect(model.progress()).toBeNull();
    http.expectOne('/api/uploader/upload').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(model.error()).toContain('retry the upload');
    model.form.controls.folderId.setValue(null);
    model.save();
    const root = http.expectOne('/api/uploader/upload');
    expect(root.request.body.has('folderId')).toBeFalse();
    root.flush({ _id: 'saved', name: 'Logo', tags: [], storageStatus: 'READY' }, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    flushLibrary();
  });

  it('supports the standalone upload URL and the legacy library entry', async () => {
    TestBed.inject(Router).resetConfig(Routes);
    const page = await harness.navigateByUrl('/upload', AssetUploadPage);
    http.expectOne('/api/uploader/folders').flush([]);
    page.model.back();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    flushLibrary();
    await harness.navigateByUrl('/hello-world', App);
    flushLibrary();
    harness.detectChanges();
    const manager = harness.routeDebugElement!.query(By.directive(AssetManagerComponent)).componentInstance as AssetManagerComponent;
    manager.upload();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/upload');
    http.expectOne('/api/uploader/folders').flush([]);
  });

  it('shows unavailable folder IDs and recovers a direct-entry folder load error', async () => {
    const page = await harness.navigateByUrl('/admin/assets/upload?folderId=missing', AssetUploadPage);
    http.expectOne('/api/uploader/folders').flush(null, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    expect(page.missingFolderId).toBe('missing');
    expect(harness.routeNativeElement!.textContent).toContain('Unavailable folder (missing)');
    const retry = [...harness.routeNativeElement!.querySelectorAll('button')].find(button => button.textContent?.includes('Retry loading folders'))!;
    retry.click();
    http.expectOne('/api/uploader/folders').flush([{ ...folder, _id: 'missing' }]);
    expect(page.missingFolderId).toBeNull();
    expect(page.model.store.foldersError()).toBe('');
  });
});
