import {
  HttpErrorResponse,
  HttpEventType,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AssetApiService } from './asset-api.service';
import { assetError, fileError, folderLabel, MAX_FILE_BYTES } from './asset-utils';

describe('AssetApiService', () => {
  let api: AssetApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AssetApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses authenticated gateway paths for listing and detail', () => {
    api.list().subscribe();
    const list = http.expectOne('/api/uploader');
    expect(list.request.withCredentials).toBeTrue();
    list.flush([]);
    api.get('an/id').subscribe();
    const detail = http.expectOne('/api/uploader/an%2Fid');
    detail.flush({});
  });
  it('sends metadata and explicit clears, archive and restore, and bodyless deletion', () => {
    api.create({ name: 'Brand', tags: ['workshop'] }).subscribe();
    const create = http.expectOne('/api/uploader');
    expect(create.request.method).toBe('POST');
    expect(create.request.body.tags).toEqual(['workshop']);
    create.flush({});
    api.update('id', { description: '', tags: [] }).subscribe();
    const patch = http.expectOne('/api/uploader/id');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ description: '', tags: [] });
    patch.flush({});
    for (const archived of [true, false]) {
      api.archive('id', archived).subscribe();
      const request = http.expectOne(
        `/api/uploader/id/${archived ? 'archive' : 'unarchive'}`
      );
      expect(request.request.method).toBe('PATCH');
      request.flush({});
    }
    api.remove('id').subscribe();
    const remove = http.expectOne('/api/uploader/id');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
  it('uploads multipart without a manual content type and reports accepted receipt', () => {
    const file = new File(['test'], 'logo.svg', {
      type: 'image/svg+xml',
    });
    let accepted = false;
    api.upload(file, ' Logo ', ' Description ').subscribe((event) => {
      if (event.type === HttpEventType.Response)
        accepted = event.status === 202;
    });
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.body.get('file')).toBe(file);
    expect(request.request.body.get('name')).toBe('Logo');
    expect(request.request.body.get('description')).toBe(
      'Description'
    );
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    expect(request.request.reportProgress).toBeTrue();
    expect(request.request.withCredentials).toBeTrue();
    request.flush({}, { status: 202, statusText: 'Accepted' });
    expect(accepted).toBeTrue();
  });
  it('omits blank optional multipart metadata', () => {
    api.upload(new File(['a'], 'a.txt'), ' ', '').subscribe();
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.body.has('name')).toBeFalse();
    expect(request.request.body.has('description')).toBeFalse();
    expect(request.request.body.has('folderId')).toBeFalse();
    request.flush({});
  });
  it('uses authenticated folder CRUD paths and encoded IDs', () => {
    api.listFolders().subscribe();
    const list = http.expectOne('/api/uploader/folders');
    expect(list.request.withCredentials).toBeTrue();
    list.flush([]);
    api.createFolder({ name: 'Brand' }).subscribe();
    const create = http.expectOne('/api/uploader/folders');
    expect(create.request.method).toBe('POST');
    expect(create.request.withCredentials).toBeTrue();
    expect(create.request.body).toEqual({ name: 'Brand' });
    create.flush({});
    api.updateFolder('an/id', { name: 'Branding' }).subscribe();
    const update = http.expectOne('/api/uploader/folders/an%2Fid');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.withCredentials).toBeTrue();
    expect(update.request.body).toEqual({ name: 'Branding' });
    update.flush({});
    api.removeFolder('an/id').subscribe();
    const remove = http.expectOne('/api/uploader/folders/an%2Fid');
    expect(remove.request.method).toBe('DELETE');
    expect(remove.request.withCredentials).toBeTrue();
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
  it('sends folder destinations for creation/upload and explicit null for root moves', () => {
    api.create({ name: 'Logo', folderId: 'brand' }).subscribe();
    const create = http.expectOne('/api/uploader');
    expect(create.request.body.folderId).toBe('brand');
    create.flush({});
    api.upload(new File(['a'], 'a.txt'), '', '', 'brand').subscribe();
    const upload = http.expectOne('/api/uploader/upload');
    expect(upload.request.body.get('folderId')).toBe('brand');
    upload.flush({}, { status: 201, statusText: 'Created' });
    api.update('logo', { folderId: null }).subscribe();
    const move = http.expectOne('/api/uploader/logo');
    expect(move.request.body).toEqual({ folderId: null });
    expect(move.request.withCredentials).toBeTrue();
    move.flush({});
  });
});
describe('asset validation and errors', () => {
  it('rejects empty and oversized files and accepts the maximum size', () => {
    expect(fileError(new File([], 'empty'))).toBeTruthy();
    expect(
      fileError(new File([new Uint8Array(MAX_FILE_BYTES)], 'max'))
    ).toBeNull();
    expect(
      fileError(
        new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'large')
      )
    ).toBeTruthy();
    expect(fileError(new File(['a'], 'a'.repeat(256)))).toBeTruthy();
  });
  it('gives recoverable session, authorization, missing and validation messages', () => {
    expect(
      assetError(new HttpErrorResponse({ status: 401 }))
    ).toContain('Sign in');
    expect(
      assetError(new HttpErrorResponse({ status: 403 }))
    ).toContain('permission');
    expect(
      assetError(new HttpErrorResponse({ status: 404 }))
    ).toContain('Refresh');
    expect(
      assetError(
        new HttpErrorResponse({
          status: 400,
          error: { message: ['Invalid name'] },
        })
      )
    ).toBe('Invalid name');
    expect(
      assetError(new HttpErrorResponse({ status: 0 }))
    ).toContain('try again');
  });
  it('distinguishes duplicate uploads, folder names and nonempty folders without depending on error bodies', () => {
    const conflict = new HttpErrorResponse({ status: 409 });
    expect(assetError(conflict, 'upload')).toContain('Identical file content');
    expect(assetError(conflict, 'upload')).toContain('archived');
    expect(assetError(conflict, 'folder-save')).toContain('case-insensitive');
    expect(assetError(conflict, 'folder-delete')).toContain('Move or delete');
    expect(assetError(new HttpErrorResponse({ status: 503 }), 'upload')).toContain('retry the upload');
    expect(assetError(new HttpErrorResponse({ status: 404 }), 'asset-save')).toContain('destination folder');
    expect(assetError(new HttpErrorResponse({ status: 404 }), 'folder-list')).toContain('Folder management is unavailable');
  });
  it('labels legacy root assets and exposes unresolved folder references', () => {
    expect(folderLabel(undefined, [])).toBe('Root');
    expect(folderLabel(null, [])).toBe('Root');
    expect(folderLabel('missing', [])).toBe('Unavailable folder (missing)');
  });
});
