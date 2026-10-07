import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AssetManagerComponent } from './asset-manager.component';
import { AssetManagerStore } from './asset-manager.store';
import { Asset } from '../services/asset.models';

const asset: Asset = {
  _id: 'asset', name: 'Logo', tags: [], archived: false, version: 0,
  storageStatus: 'READY', createdAt: '', updatedAt: '',
};

describe('Asset manager singleton and operation streams', () => {
  let store: AssetManagerStore;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AssetManagerComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideNoopAnimations()],
    });
    store = TestBed.inject(AssetManagerStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shares state across managers and keeps an in-flight load alive after page teardown', () => {
    const first = TestBed.createComponent(AssetManagerComponent);
    const second = TestBed.createComponent(AssetManagerComponent);
    expect(first.componentInstance.store).toBe(store);
    expect(second.componentInstance.store).toBe(store);
    const load = http.expectOne('/api/uploader');
    const folders = http.expectOne('/api/uploader/folders');
    first.destroy();
    expect(load.cancelled).toBeFalse();
    load.flush([asset]);
    folders.flush([]);
    expect(second.componentInstance.assets()).toEqual([asset]);
    store.setQuery('Logo');
    second.destroy();
    expect(store.libraryViewModel().filters.query).toBe('Logo');
    expect(store.assets()).toEqual([asset]);
  });

  it('starts details pending state only when subscribed and cleans up cancellation', () => {
    const details = store.loadDetails(asset);
    expect(store.pending().size).toBe(0);
    http.expectNone('/api/uploader/asset');
    const subscription = details.subscribe();
    expect(store.pending().has(asset._id)).toBeTrue();
    const request = http.expectOne('/api/uploader/asset');
    subscription.unsubscribe();
    expect(request.cancelled).toBeTrue();
    expect(store.pending().size).toBe(0);
    details.subscribe();
    http.expectOne('/api/uploader/asset').flush(asset);
    expect(store.pending().size).toBe(0);
  });

  it('suppresses overlapping details and releases pending on failure for retry', () => {
    store.loadDetails(asset).subscribe();
    let duplicateEmitted = false;
    store.loadDetails(asset).subscribe(() => duplicateEmitted = true);
    http.expectOne('/api/uploader/asset').flush(null, { status: 500, statusText: 'Failure' });
    expect(duplicateEmitted).toBeFalse();
    expect(store.pending().size).toBe(0);
    expect(store.error()).toContain('try again');
    store.loadDetails(asset).subscribe();
    http.expectOne('/api/uploader/asset').flush(asset);
    expect(store.error()).toBe('');
  });

  it('commits metadata only on server success, retaining cache on failure', () => {
    const save = store.saveAsset({ name: 'Logo' });
    http.expectNone('/api/uploader');
    expect(store.assets()).toEqual([]);
    save.subscribe();
    expect(store.assets()).toEqual([]);
    http.expectOne('/api/uploader').flush(asset);
    expect(store.assets()).toEqual([asset]);
    store.saveAsset({ name: 'Changed' }, asset._id).subscribe({ error: () => {} });
    http.expectOne('/api/uploader/asset').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(store.assets()).toEqual([asset]);
    store.saveAsset({ name: 'Changed' }, asset._id).subscribe();
    http.expectOne('/api/uploader/asset').flush({ ...asset, name: 'Changed' });
    expect(store.assets().map((item) => item.name)).toEqual(['Changed']);
  });

  it('does not commit upload progress or failures, then shares the response asset', () => {
    const upload = store.upload(new File(['logo'], 'logo.txt'), 'Logo', '', null);
    http.expectNone('/api/uploader/upload');
    const progress = jasmine.createSpy('upload event');
    upload.subscribe({ next: progress, error: () => {} });
    const request = http.expectOne('/api/uploader/upload');
    request.event({ type: HttpEventType.UploadProgress, loaded: 4, total: 4 });
    expect(progress).toHaveBeenCalledWith({ kind: 'progress', percent: 100 });
    expect(store.assets()).toEqual([]);
    request.flush(null, { status: 409, statusText: 'Conflict' });
    expect(store.assets()).toEqual([]);
    upload.subscribe(progress);
    http.expectOne('/api/uploader/upload').flush(asset);
    expect(progress).toHaveBeenCalledWith({ kind: 'complete', asset });
    expect(store.assets()).toEqual([asset]);
    expect(store.notice()).toBe('File uploaded and stored.');
  });

  it('commits folder creation/deletion only after success and resets a deleted selection', () => {
    const folder = { _id: 'folder', name: 'Brand', version: 0, createdAt: '', updatedAt: '' };
    const create = store.writeFolder({}, folder.name);
    http.expectNone('/api/uploader/folders');
    create.subscribe();
    expect(store.folders()).toEqual([]);
    http.expectOne('/api/uploader/folders').flush(folder);
    expect(store.folders()).toEqual([folder]);
    store.setFolderFilter(folder._id);
    store.writeFolder({ folder, remove: true }, '').subscribe({ error: () => {} });
    http.expectOne('/api/uploader/folders/folder').flush(null, { status: 409, statusText: 'Conflict' });
    expect(store.folders()).toEqual([folder]);
    expect(store.folderFilter()).toBe(folder._id);
    store.writeFolder({ folder, remove: true }, '').subscribe();
    http.expectOne('/api/uploader/folders/folder').flush(null, { status: 204, statusText: 'No Content' });
    expect(store.folders()).toEqual([]);
    expect(store.folderFilter()).toBe('all');
  });
});
