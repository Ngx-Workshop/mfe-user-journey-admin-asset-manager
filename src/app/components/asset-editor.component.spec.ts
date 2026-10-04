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

describe('Asset editor recovery and progress', () => {
  let http: HttpTestingController;
  let ref: { close: jasmine.Spy; disableClose: boolean };
  function setup(upload = false) {
    ref = { close: jasmine.createSpy('close'), disableClose: false };
    TestBed.configureTestingModule({
      imports: [AssetEditorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { upload } },
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
});
