import {
  HttpEventType,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AssetEditorComponent } from './asset-editor.component';
import { Asset, Folder } from '../services/asset-api.service';

describe('Asset editor recovery and progress', () => {
  let http: HttpTestingController;
  let ref: { close: jasmine.Spy; disableClose: boolean };
  const folder: Folder = { _id: 'brand', name: 'Brand', version: 0, createdAt: '', updatedAt: '' };
  function setup(upload = false, asset?: Asset) {
    ref = { close: jasmine.createSpy('close'), disableClose: false };
    TestBed.configureTestingModule({
      imports: [AssetEditorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { upload, asset, folders: [folder], folderId: folder._id } },
        { provide: MatDialogRef, useValue: ref },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AssetEditorComponent);
    fixture.detectChanges();
    return fixture;
  }
  afterEach(() => http.verify());
  it('keeps entered metadata and dialog open after a failed save, then allows retry', () => {
    const fixture = setup();
    const editor = fixture.componentInstance;
    editor.form.controls.name.setValue('Logo');
    editor.save();
    expect(ref.disableClose).toBeTrue();
    expect(editor.form.disabled).toBeTrue();
    http
      .expectOne('/api/uploader')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    expect(ref.close).not.toHaveBeenCalled();
    expect(editor.form.controls.name.value).toBe('Logo');
    expect(editor.form.enabled).toBeTrue();
    expect(ref.disableClose).toBeFalse();
    expect(editor.busy()).toBeFalse();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Unable to reach'
    );
    editor.save();
    http
      .expectOne('/api/uploader')
      .flush({ _id: 'saved', name: 'Logo' });
    expect(ref.close).toHaveBeenCalled();
  });
  it('blocks invalid files, shows upload progress and closes with pending-storage result', () => {
    const fixture = setup(true);
    const editor = fixture.componentInstance;
    editor.choose({
      target: { files: [new File([], 'empty.txt')] },
    } as unknown as Event);
    editor.save();
    http.expectNone('/api/uploader/upload');
    expect(editor.error()).toContain('nonempty');
    editor.choose({
      target: { files: [new File(['test'], 'file.txt')] },
    } as unknown as Event);
    editor.save();
    const request = http.expectOne('/api/uploader/upload');
    request.event({
      type: HttpEventType.UploadProgress,
      loaded: 2,
      total: 4,
    });
    expect(editor.progress()).toBe(50);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('50%');
    const saved = { _id: 'file', storageStatus: 'PENDING_STORAGE' };
    request.flush(saved, { status: 202, statusText: 'Accepted' });
    expect(ref.close).toHaveBeenCalledWith(saved);
  });
  it('retains the file and folder on duplicate conflict and resets progress before retry', () => {
    const fixture = setup(true);
    const editor = fixture.componentInstance;
    const file = new File(['test'], 'logo.svg');
    editor.file.set(file);
    editor.form.controls.name.setValue('Logo');
    editor.save();
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.body.get('folderId')).toBe(folder._id);
    request.event({ type: HttpEventType.UploadProgress, loaded: 4, total: 4 });
    request.flush(null, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Identical file content');
    expect(ref.close).not.toHaveBeenCalled();
    expect(editor.file()).toBe(file);
    expect(editor.form.getRawValue().folderId).toBe(folder._id);
    expect(editor.form.enabled).toBeTrue();
    expect(ref.disableClose).toBeFalse();
    editor.save();
    expect(editor.progress()).toBeNull();
    const retry = http.expectOne('/api/uploader/upload');
    expect(retry.request.body.get('file')).toBe(file);
    retry.flush(null, { status: 503, statusText: 'Unavailable' });
    expect(editor.error()).toContain('retry the upload');
    editor.form.controls.folderId.setValue(null);
    editor.save();
    const root = http.expectOne('/api/uploader/upload');
    expect(root.request.body.has('folderId')).toBeFalse();
    root.flush({ _id: 'saved', storageStatus: 'READY' }, { status: 201, statusText: 'Created' });
    expect(ref.close).toHaveBeenCalled();
  });
  it('preserves an existing folder on edit and sends explicit null to move to root', () => {
    const asset: Asset = {
      _id: 'logo', name: 'Logo', tags: [], archived: false, version: 0,
      storageStatus: 'READY', storageUrl: 'https://assets.example.test/logo.svg',
      folderId: folder._id, createdAt: '', updatedAt: '',
    };
    const fixture = setup(false, asset);
    const editor = fixture.componentInstance;
    expect(editor.form.controls.folderId.value).toBe(folder._id);
    editor.form.controls.folderId.setValue(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-select').textContent).toContain('Root');
    editor.save();
    const move = http.expectOne('/api/uploader/logo');
    expect(move.request.body.folderId).toBeNull();
    expect(move.request.body.storageUrl).toBeUndefined();
    move.flush({ ...asset, folderId: null });
    expect(ref.close).toHaveBeenCalledWith({ ...asset, folderId: null });
  });
});
