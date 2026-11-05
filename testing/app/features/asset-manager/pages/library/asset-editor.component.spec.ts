import {
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
import { AssetEditorComponent } from '../../../../../../src/app/features/asset-manager/pages/library/asset-editor.component';
import {
  Asset,
  Folder,
} from '../../../../../../src/app/features/asset-manager/models/asset.models';

describe('Asset editor recovery and progress', () => {
  let http: HttpTestingController;
  let ref: { close: jasmine.Spy; disableClose: boolean };
  const folder: Folder = {
    _id: 'brand',
    name: 'Brand',
    version: 0,
    createdAt: '',
    updatedAt: '',
  };
  function setup(asset?: Asset) {
    ref = { close: jasmine.createSpy('close'), disableClose: false };
    TestBed.configureTestingModule({
      imports: [AssetEditorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            asset,
            folders: [folder],
            folderId: folder._id,
          },
        },
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
  it('preserves an existing folder on edit and sends explicit null to move to root', () => {
    const asset: Asset = {
      _id: 'logo',
      name: 'Logo',
      tags: [],
      archived: false,
      version: 0,
      storageStatus: 'READY',
      storageUrl: 'https://assets.example.test/logo.svg',
      folderId: folder._id,
      createdAt: '',
      updatedAt: '',
    };
    const fixture = setup(asset);
    const editor = fixture.componentInstance;
    expect(editor.form.controls.folderId.value).toBe(folder._id);
    editor.form.controls.folderId.setValue(null);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('mat-select').textContent
    ).toContain('Root');
    editor.save();
    const move = http.expectOne('/api/uploader/logo');
    expect(move.request.body.folderId).toBeNull();
    expect(move.request.body.storageUrl).toBeUndefined();
    move.flush({ ...asset, folderId: null });
    expect(ref.close).toHaveBeenCalledWith({
      ...asset,
      folderId: null,
    });
  });
});
