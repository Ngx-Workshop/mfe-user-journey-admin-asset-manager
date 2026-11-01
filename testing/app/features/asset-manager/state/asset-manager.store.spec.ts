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
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AssetManagerComponent } from '../../../../../src/app/features/asset-manager/pages/library/asset-manager.component';
import { AssetManagerStore } from '../../../../../src/app/features/asset-manager/state/asset-manager.store';
import { Asset } from '../../../../../src/app/features/asset-manager/models/asset.models';

const asset: Asset = {
  _id: 'asset',
  name: 'Logo',
  tags: [],
  archived: false,
  version: 0,
  storageStatus: 'READY',
  createdAt: '',
  updatedAt: '',
};

describe('Asset manager singleton and operation streams', () => {
  let store: AssetManagerStore;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AssetManagerComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
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

  it('ignores stale, same-folder and missing-asset move intentions without issuing writes', () => {
    store.refresh();
    http.expectOne('/api/uploader').flush([asset]);
    store.moveAsset({ assetId: 'missing', folderId: null });
    store.moveAsset({
      assetId: asset._id,
      folderId: 'deleted-folder',
    });
    store.moveAsset({ assetId: asset._id, folderId: 'all' });
    store.moveAsset({ assetId: asset._id, folderId: null });
    http.expectNone('/api/uploader/asset');
    expect(store.assets()).toEqual([asset]);
    expect(store.pending().size).toBe(0);
  });

  it('bounds batch concurrency, skips duplicates and same-folder assets, and retries only failed moves', () => {
    const folder = {
      _id: 'folder',
      name: 'Brand',
      version: 0,
      createdAt: '',
      updatedAt: '',
    };
    const assets = Array.from({ length: 5 }, (_, i) => ({
      ...asset,
      _id: 'asset-' + i,
    }));
    const alreadyMoved = {
      ...asset,
      _id: 'already',
      folderId: folder._id,
    };
    store.refresh();
    http.expectOne('/api/uploader').flush([...assets, alreadyMoved]);
    store.refreshFolders();
    http.expectOne('/api/uploader/folders').flush([folder]);
    const move = {
      assetIds: [
        ...assets.map((item) => item._id),
        assets[0]._id,
        alreadyMoved._id,
      ],
      folderId: folder._id,
    };
    store.moveAssets(move);
    const initial = http.match(
      (request) => request.method === 'PATCH'
    );
    expect(initial.length).toBe(4);
    expect(store.pending().size).toBe(5);
    for (const request of initial)
      expect(request.request.body).toEqual({ folderId: folder._id });
    store.moveAssets(move);
    http.expectNone((request) => request.method === 'PATCH');
    initial[0].flush(null, {
      status: 503,
      statusText: 'Unavailable',
    });
    const queued = http.expectOne('/api/uploader/asset-4');
    initial
      .slice(1)
      .forEach((request, index) =>
        request.flush({ ...assets[index + 1], folderId: folder._id })
      );
    queued.flush({ ...assets[4], folderId: folder._id });
    expect(store.moving()).toBeFalse();
    expect(store.pending().size).toBe(0);
    expect(
      store.assets().find((item) => item._id === assets[0]._id)
        ?.folderId
    ).toBeUndefined();
    expect(store.feedback().state).toBe('error');
    expect(store.feedback().message).toContain('Moved 4 of 5 assets');
    store.moveAssets(move);
    const retry = http.expectOne('/api/uploader/asset-0');
    http.expectNone((request) => request.method === 'PATCH');
    retry.flush({ ...assets[0], folderId: folder._id });
    expect(store.feedback().state).toBe('saved');
    expect(
      store.assets().every((item) => item.folderId === folder._id)
    ).toBeTrue();
  });

  it('moves a selected group back to Root with explicit null folderId and accurate feedback', () => {
    const assets = [
      { ...asset, _id: 'first', folderId: 'brand' },
      { ...asset, _id: 'second', folderId: 'brand' },
    ];
    store.refresh();
    http.expectOne('/api/uploader').flush(assets);
    store.moveAssets({
      assetIds: ['first', 'second'],
      folderId: null,
    });
    const requests = http.match(
      (request) => request.method === 'PATCH'
    );
    expect(requests.length).toBe(2);
    requests.forEach((request, index) => {
      expect(request.request.body).toEqual({ folderId: null });
      request.flush({ ...assets[index], folderId: null });
    });
    expect(store.feedback().message).toBe('Moved 2 assets to Root.');
    expect(
      store.assets().every((item) => item.folderId === null)
    ).toBeTrue();
    expect(store.pending().size).toBe(0);
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
    store
      .loadDetails(asset)
      .subscribe(() => (duplicateEmitted = true));
    http
      .expectOne('/api/uploader/asset')
      .flush(null, { status: 500, statusText: 'Failure' });
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
    store
      .saveAsset({ name: 'Changed' }, asset._id)
      .subscribe({ error: () => {} });
    http
      .expectOne('/api/uploader/asset')
      .flush(null, { status: 403, statusText: 'Forbidden' });
    expect(store.assets()).toEqual([asset]);
    store.saveAsset({ name: 'Changed' }, asset._id).subscribe();
    http
      .expectOne('/api/uploader/asset')
      .flush({ ...asset, name: 'Changed' });
    expect(store.assets().map((item) => item.name)).toEqual([
      'Changed',
    ]);
  });

  it('does not commit upload progress or failures, then shares the response asset', () => {
    const upload = store.upload(
      new File(['logo'], 'logo.txt'),
      'Logo',
      '',
      null
    );
    http.expectNone('/api/uploader/upload');
    const progress = jasmine.createSpy('upload event');
    upload.subscribe({ next: progress, error: () => {} });
    const request = http.expectOne('/api/uploader/upload');
    request.event({
      type: HttpEventType.UploadProgress,
      loaded: 4,
      total: 4,
    });
    expect(progress).toHaveBeenCalledWith({
      kind: 'progress',
      percent: 100,
    });
    expect(store.assets()).toEqual([]);
    request.flush(null, { status: 409, statusText: 'Conflict' });
    expect(store.assets()).toEqual([]);
    upload.subscribe(progress);
    http.expectOne('/api/uploader/upload').flush(asset);
    expect(progress).toHaveBeenCalledWith({
      kind: 'complete',
      asset,
    });
    expect(store.assets()).toEqual([asset]);
    expect(store.notice()).toBe('File uploaded and stored.');
  });

  it('commits folder creation/deletion only after success and resets a deleted selection', () => {
    const folder = {
      _id: 'folder',
      name: 'Brand',
      version: 0,
      createdAt: '',
      updatedAt: '',
    };
    const create = store.writeFolder({}, folder.name);
    http.expectNone('/api/uploader/folders');
    create.subscribe();
    expect(store.folders()).toEqual([]);
    http.expectOne('/api/uploader/folders').flush(folder);
    expect(store.folders()).toEqual([folder]);
    store.setFolderFilter(folder._id);
    store
      .writeFolder({ folder, remove: true }, '')
      .subscribe({ error: () => {} });
    http
      .expectOne('/api/uploader/folders/folder')
      .flush(null, { status: 409, statusText: 'Conflict' });
    expect(store.folders()).toEqual([folder]);
    expect(store.folderFilter()).toBe(folder._id);
    store.writeFolder({ folder, remove: true }, '').subscribe();
    http
      .expectOne('/api/uploader/folders/folder')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(store.folders()).toEqual([]);
    expect(store.folderFilter()).toBe('all');
  });
});
