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
import {
  AssetApiService,
  assetError,
  fileError,
  MAX_FILE_BYTES,
} from './asset-api.service';

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
    request.flush({});
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
});
