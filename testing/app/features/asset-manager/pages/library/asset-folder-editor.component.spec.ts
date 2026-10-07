import { provideHttpClient } from '@angular/common/http';
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
import { AssetFolderEditorComponent } from '../../../../../../src/app/features/asset-manager/pages/library/asset-folder-editor.component';
import { FolderEditorData } from '../../../../../../src/app/features/asset-manager/models/asset-manager.models';

describe('Folder editor', () => {
  let http: HttpTestingController;
  let ref: { close: jasmine.Spy; disableClose: boolean };
  const folder = {
    _id: 'brand',
    name: 'Brand',
    version: 0,
    createdAt: '',
    updatedAt: '',
  };
  function setup(data: FolderEditorData = {}) {
    ref = { close: jasmine.createSpy('close'), disableClose: false };
    TestBed.configureTestingModule({
      imports: [AssetFolderEditorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: ref },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(
      AssetFolderEditorComponent
    );
    fixture.detectChanges();
    return fixture;
  }
  afterEach(() => http.verify());
  it('blocks blank names, trims creation and retains input on duplicate conflict for retry', () => {
    const fixture = setup();
    const editor = fixture.componentInstance;
    editor.name.setValue('   ');
    editor.save();
    http.expectNone('/api/uploader/folders');
    editor.name.setValue(' Brand ');
    editor.save();
    expect(ref.disableClose).toBeTrue();
    const create = http.expectOne('/api/uploader/folders');
    expect(create.request.body).toEqual({ name: 'Brand' });
    create.flush(null, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'case-insensitive'
    );
    expect(editor.name.value).toBe(' Brand ');
    expect(editor.name.enabled).toBeTrue();
    expect(editor.busy()).toBeFalse();
    expect(ref.disableClose).toBeFalse();
    expect(ref.close).not.toHaveBeenCalled();
    editor.name.setValue('Branding');
    editor.save();
    http
      .expectOne('/api/uploader/folders')
      .flush({ ...folder, name: 'Branding' });
    expect(ref.close).toHaveBeenCalledWith({
      saved: { ...folder, name: 'Branding' },
    });
  });
  it('prevents native form navigation and sends a folder request from the save button', () => {
    const fixture = setup();
    const editor = fixture.componentInstance;
    editor.name.setValue('Brand');
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector(
      '#asset-folder-form'
    ) as HTMLFormElement;
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    const request = http.expectOne('/api/uploader/folders');
    expect(request.request.method).toBe('POST');
    request.flush({ ...folder });
    expect(ref.close).toHaveBeenCalledWith({ saved: folder });
  });
  it('renames using the selected folder and retains it on authorization failure', () => {
    const fixture = setup({ folder });
    const editor = fixture.componentInstance;
    editor.name.setValue('Branding');
    editor.save();
    const rename = http.expectOne('/api/uploader/folders/brand');
    expect(rename.request.method).toBe('PATCH');
    rename.flush(null, { status: 403, statusText: 'Forbidden' });
    expect(editor.error()).toContain('permission');
    expect(editor.name.value).toBe('Branding');
    expect(ref.close).not.toHaveBeenCalled();
  });
  it('does not delete until confirmed and explains nonempty conflicts, including archived assets', () => {
    const fixture = setup({ folder, remove: true });
    const editor = fixture.componentInstance;
    http.expectNone('/api/uploader/folders/brand');
    expect(fixture.nativeElement.textContent).toContain(
      'cannot be undone'
    );
    const confirm = fixture.nativeElement.querySelector(
      'button[mat-flat-button]'
    ) as HTMLButtonElement;
    confirm.click();
    const remove = http.expectOne('/api/uploader/folders/brand');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'archived assets'
    );
    expect(ref.close).not.toHaveBeenCalled();
    expect(editor.busy()).toBeFalse();
    editor.save();
    http
      .expectOne('/api/uploader/folders/brand')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(ref.close).toHaveBeenCalledWith({ removed: folder._id });
  });
});
