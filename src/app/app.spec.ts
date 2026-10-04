import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { App } from './app';
import { AssetManagerComponent } from './components/asset-manager.component';
import { Asset, Folder } from './services/asset-api.service';
import { AssetEditorComponent } from './components/asset-editor.component';
import { AssetFolderEditorComponent } from './components/asset-folder-editor.component';

const logo: Asset = {
  _id: 'logo',
  name: 'Workshop logo',
  description: 'Brand artwork',
  tags: ['branding'],
  archived: false,
  version: 0,
  storageStatus: 'READY',
  storageUrl: 'https://assets.example.test/logo.svg',
  originalFilename: 'logo.svg',
  mediaType: 'image/svg+xml',
  sizeBytes: 100,
  createdAt: '2026-10-03T12:00:00Z',
  updatedAt: '2026-10-03T12:00:00Z',
};
const record: Asset = {
  ...logo,
  _id: 'record',
  name: 'Course resource',
  tags: [],
  archived: true,
  storageStatus: 'STORAGE_FAILED',
  originalFilename: undefined,
  mediaType: undefined,
};
const branding: Folder = {
  _id: 'branding', name: 'Branding', version: 0,
  createdAt: logo.createdAt, updatedAt: logo.updatedAt,
};

describe('Asset manager', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function setup() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('/api/uploader/folders').flush([branding]);
    const manager = fixture.debugElement.query(
      By.directive(AssetManagerComponent)
    ).componentInstance as AssetManagerComponent;
    return { fixture, manager };
  }
  it('shows loading then a useful empty library', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.textContent).toContain(
      'Loading your library'
    );
    http.expectOne('/api/uploader').flush([]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('h1').textContent
    ).toContain('Asset Manager');
    expect(fixture.nativeElement.textContent).toContain(
      'Your library starts here'
    );
  });
  it('filters archive, media, storage and case-insensitive filename/tag searches', () => {
    const { fixture, manager } = setup();
    http.expectOne('/api/uploader').flush([logo, record]);
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector(
      '.asset-card__preview'
    ) as HTMLImageElement;
    expect(preview.src).toBe(
      'https://assets.example.test/logo.svg'
    );
    expect(preview.alt).toBe(logo.name);
    expect(manager.filtered()).toEqual([logo]);
    manager.setQuery('BRANDING');
    expect(manager.filtered()).toEqual([logo]);
    manager.setQuery('logo.svg');
    expect(manager.filtered()).toEqual([logo]);
    manager.setTypeFilter('video');
    expect(manager.filtered()).toEqual([]);
    manager.clearFilters();
    manager.setStorageFilter('STORAGE_FAILED');
    expect(manager.filtered()).toEqual([]);
    manager.setStorageFilter('all');
    manager.setArchiveFilter('archived');
    expect(manager.filtered()).toEqual([record]);
  });
  it('recovers from a list failure by retrying', () => {
    const { fixture, manager } = setup();
    http
      .expectOne('/api/uploader')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Unable to reach'
    );
    expect(manager.loading()).toBeFalse();
    manager.refresh();
    http.expectOne('/api/uploader/folders').flush([branding]);
    http.expectOne('/api/uploader').flush([logo]);
    fixture.detectChanges();
    expect(manager.error()).toBe('');
    expect(manager.filtered()).toEqual([logo]);
  });
  it('retains assets when archive fails and replaces the server result on success', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([logo]);
    manager.archive(logo);
    expect(manager.pending().has(logo._id)).toBeTrue();
    http
      .expectOne('/api/uploader/logo/archive')
      .flush(null, { status: 500, statusText: 'Failure' });
    expect(manager.assets()).toEqual([logo]);
    expect(manager.pending().size).toBe(0);
    manager.archive(logo);
    http
      .expectOne('/api/uploader/logo/archive')
      .flush({ ...logo, archived: true, version: 1 });
    expect(manager.filtered()).toEqual([]);
  });
  it('requires confirmation before deletion and removes only after server success', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([logo]);
    const dialog = spyOn(
      TestBed.inject(MatDialog),
      'open'
    ).and.returnValue({ afterClosed: () => of(false) } as ReturnType<
      MatDialog['open']
    >);
    manager.delete(logo);
    http.expectNone('/api/uploader/logo');
    expect(manager.assets()).toEqual([logo]);
    dialog.and.returnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);
    manager.delete(logo);
    expect(manager.assets()).toEqual([logo]);
    http
      .expectOne('/api/uploader/logo')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(manager.assets()).toEqual([]);
  });
  it('combines folder and existing filters, treats missing IDs as root and resets folders', () => {
    const { fixture, manager } = setup();
    const filed = { ...logo, folderId: branding._id };
    http.expectOne('/api/uploader').flush([filed, record, { ...logo, _id: 'root', folderId: null }]);
    manager.setArchiveFilter('all');
    manager.store.setFolderFilter(null);
    expect(manager.filtered().map((asset) => asset._id)).toEqual(['record', 'root']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-select').textContent).toContain('Root');
    manager.store.setFolderFilter(branding._id);
    manager.setQuery('BRANDING');
    expect(manager.filtered()).toEqual([filed]);
    manager.setStorageFilter('STORAGE_FAILED');
    expect(manager.filtered()).toEqual([]);
    manager.clearFilters();
    expect(manager.store.folderFilter()).toBe('all');
    expect(manager.filtered().length).toBe(2);
  });
  it('recovers folder loads independently and applies successful rename/deletion', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([]);
    manager.store.setFolderFilter(branding._id);
    manager.store.refreshFolders();
    http.expectOne('/api/uploader/folders').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(manager.store.foldersError()).toContain('try again');
    expect(manager.store.folders()).toEqual([branding]);
    expect(manager.store.foldersLoading()).toBeFalse();
    manager.store.refreshFolders();
    http.expectOne('/api/uploader/folders').flush([branding]);
    expect(manager.store.foldersError()).toBe('');
    manager.store.saveFolder({ saved: { ...branding, name: 'Brand', version: 1 } });
    expect(manager.store.folders()[0].name).toBe('Brand');
    manager.store.saveFolder({ removed: branding._id });
    expect(manager.store.folders()).toEqual([]);
    expect(manager.store.folderFilter()).toBe('all');
  });
  it('passes the selected destination to intake and replaces assets only after dialog success', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([logo]);
    manager.store.setFolderFilter(branding._id);
    const moved = { ...logo, folderId: branding._id };
    const dialog = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({
      afterClosed: () => of(undefined),
    } as ReturnType<MatDialog['open']>);
    manager.edit(undefined, true);
    expect(dialog).toHaveBeenCalledWith(AssetEditorComponent, jasmine.objectContaining({
      data: { asset: undefined, upload: true, folders: [branding], folderId: branding._id },
    }));
    expect(manager.assets()).toEqual([logo]);
    dialog.and.returnValue({ afterClosed: () => of(moved) } as ReturnType<MatDialog['open']>);
    manager.edit(logo);
    expect(manager.filtered()).toEqual([moved]);
    expect(manager.assets()[0].storageUrl).toBe(logo.storageUrl);
  });
  it('opens folder deletion confirmation and changes local folders only after success', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([]);
    manager.store.setFolderFilter(branding._id);
    const dialog = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({
      afterClosed: () => of(undefined),
    } as ReturnType<MatDialog['open']>);
    manager.deleteFolder(branding);
    expect(dialog).toHaveBeenCalledWith(AssetFolderEditorComponent, jasmine.objectContaining({
      data: { folder: branding, remove: true },
    }));
    expect(manager.store.folders()).toEqual([branding]);
    dialog.and.returnValue({
      afterClosed: () => of({ removed: branding._id }),
    } as ReturnType<MatDialog['open']>);
    manager.deleteFolder(branding);
    expect(manager.store.folders()).toEqual([]);
    expect(manager.store.folderFilter()).toBe('all');
  });
});
