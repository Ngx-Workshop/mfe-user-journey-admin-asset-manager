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
import { Asset } from './services/asset-api.service';

const logo: Asset = {
  _id: 'logo',
  name: 'Workshop logo',
  description: 'Brand artwork',
  tags: ['branding'],
  archived: false,
  version: 0,
  storageStatus: 'PENDING_STORAGE',
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
  storageStatus: 'AWAITING_UPLOAD',
  originalFilename: undefined,
  mediaType: undefined,
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
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([logo, record]);
    expect(manager.filtered()).toEqual([logo]);
    manager.query.set('BRANDING');
    expect(manager.filtered()).toEqual([logo]);
    manager.query.set('logo.svg');
    expect(manager.filtered()).toEqual([logo]);
    manager.typeFilter.set('video');
    expect(manager.filtered()).toEqual([]);
    manager.clearFilters();
    manager.storageFilter.set('AWAITING_UPLOAD');
    expect(manager.filtered()).toEqual([]);
    manager.storageFilter.set('all');
    manager.archiveFilter.set('archived');
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
});
