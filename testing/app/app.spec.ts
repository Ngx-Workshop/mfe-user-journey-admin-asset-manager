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
import { App } from '../../src/app/app';
import { AssetManagerComponent } from '../../src/app/features/asset-manager/pages/library/asset-manager.component';
import {
  Asset,
  Folder,
} from '../../src/app/features/asset-manager/models/asset.models';
import { AssetEditorComponent } from '../../src/app/features/asset-manager/pages/library/asset-editor.component';
import { AssetFolderEditorComponent } from '../../src/app/features/asset-manager/pages/library/asset-folder-editor.component';
import { AssetCardComponent } from '../../src/app/features/asset-manager/pages/library/asset-card.component';

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
  _id: 'branding',
  name: 'Branding',
  version: 0,
  createdAt: logo.createdAt,
  updatedAt: logo.updatedAt,
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
  it('truncates long card names on one line with and without an archived badge', () => {
    const fixture = TestBed.createComponent(AssetCardComponent);
    const host: HTMLElement = fixture.nativeElement;
    host.style.display = 'block';
    host.style.width = '180px';
    const name = 'A long asset name with spaces '.repeat(4);

    for (const archived of [false, true]) {
      fixture.componentRef.setInput('asset', {
        ...record,
        name,
        archived,
      });
      fixture.detectChanges();

      const button = host.querySelector<HTMLButtonElement>(
        '.asset-card__name'
      )!;
      const heading = host.querySelector<HTMLElement>(
        '.asset-card__heading'
      )!;
      const style = getComputedStyle(button);
      expect(button.textContent?.trim()).toBe(name.trim());
      expect(style.whiteSpace).toBe('nowrap');
      expect(style.overflow).toBe('hidden');
      expect(style.textOverflow).toBe('ellipsis');
      expect(button.scrollWidth).toBeGreaterThan(button.clientWidth);
      expect(heading.scrollWidth).toBeLessThanOrEqual(
        heading.clientWidth
      );
    }
  });
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
    expect(preview.src).toBe('https://assets.example.test/logo.svg');
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
  it('puts two-row selection controls in the Browse header and uses transparent, halo-free photo checkboxes', async () => {
    const { fixture } = setup();
    http.expectOne('/api/uploader').flush([logo]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const header = element.querySelector(
      '.asset-library__browse-panel ngx-asset-selection-toolbar'
    )!;
    expect(header).not.toBeNull();
    expect(
      element.querySelector(
        'ngx-asset-library-results ngx-asset-selection-toolbar'
      )
    ).toBeNull();
    expect(
      element.querySelector('.asset-library__asset-count')
    ).toBeNull();
    const row = header.querySelector<HTMLElement>(
      '.asset-selection__row'
    )!;
    const clear = header.querySelector<HTMLButtonElement>(
      '.asset-selection__clear'
    )!;
    expect(row.textContent).toContain('Select all');
    expect(row.textContent).toContain('0 selected');
    expect(getComputedStyle(clear).textDecorationLine).toContain(
      'underline'
    );
    expect(clear.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      row.getBoundingClientRect().bottom
    );
    const checkbox = element.querySelector<HTMLElement>(
      '.asset-results__checkbox'
    )!;
    checkbox.querySelector<HTMLInputElement>('input')!.click();
    fixture.detectChanges();
    expect(row.textContent).toContain('1 selected');
    expect(getComputedStyle(checkbox).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)'
    );
    expect(getComputedStyle(checkbox).boxShadow).toBe('none');
    expect(
      getComputedStyle(checkbox)
        .getPropertyValue(
          '--mat-checkbox-selected-focus-state-layer-opacity'
        )
        .trim()
    ).toBe('0');
    expect(clear.disabled).toBeFalse();
    clear.click();
    fixture.detectChanges();
    expect(
      checkbox.querySelector<HTMLInputElement>('input')!.checked
    ).toBeFalse();
  });

  it('keeps compact card labels and actions available on keyboard focus', () => {
    const fixture = TestBed.createComponent(AssetCardComponent);
    fixture.componentRef.setInput('asset', logo);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const overlay = element.querySelector<HTMLElement>(
      '.asset-card__overlay'
    )!;
    const name = element.querySelector<HTMLButtonElement>(
      '.asset-card__name'
    )!;
    const menu = element.querySelector<HTMLButtonElement>(
      '.asset-card__menu-trigger'
    )!;
    const preview = element.querySelector<HTMLElement>(
      '.asset-card__visual'
    )!;
    const card = element.querySelector<HTMLElement>('.asset-card')!;
    expect(preview.contains(overlay)).toBeTrue();
    expect(card.getBoundingClientRect().height).toBeLessThanOrEqual(
      preview.getBoundingClientRect().height + 2
    );
    expect(getComputedStyle(overlay).opacity).toBe('0');
    expect(getComputedStyle(menu).opacity).toBe('0');
    name.focus();
    expect(getComputedStyle(overlay).opacity).toBe('1');
    expect(getComputedStyle(menu).opacity).toBe('1');
    const details = spyOn(fixture.componentInstance.details, 'emit');
    name.click();
    expect(details).toHaveBeenCalled();
  });

  it('moves selected photos together and reports partial failures in the action bar, retaining failed selection for retry', async () => {
    const { fixture, manager } = setup();
    const second = { ...logo, _id: 'second', name: 'Second photo' };
    http.expectOne('/api/uploader').flush([logo, second]);
    manager.store.setFolderFilter(null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const select = (name: string) => {
      element
        .querySelector<HTMLInputElement>(
          `input[aria-label="Select ${name}"]`
        )!
        .click();
      fixture.detectChanges();
    };
    select(logo.name);
    select(second.name);
    expect(element.textContent).toContain('2 selected');
    const drag = () => {
      const dataTransfer = new DataTransfer();
      element.querySelector('ngx-asset-card')!.dispatchEvent(
        new DragEvent('dragstart', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
      const target = element.querySelector(
        'mat-tree-node[aria-label="Branding"]'
      )!;
      target.dispatchEvent(
        new DragEvent('dragover', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
      target.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
      fixture.detectChanges();
    };
    drag();
    expect(manager.store.moving()).toBeTrue();
    expect(
      element.querySelector('ngx-action-bar ngx-save-feedback')!
        .textContent
    ).toContain('Moving 2 assets');
    expect(
      element.querySelector('.asset-results__notice')
    ).toBeNull();
    expect(
      element.querySelector('.asset-library__selection-controls')!
        .textContent
    ).toContain('2 selected');
    const firstMove = http.expectOne('/api/uploader/logo');
    const secondMove = http.expectOne('/api/uploader/second');
    expect(firstMove.request.body).toEqual({
      folderId: branding._id,
    });
    expect(secondMove.request.body).toEqual({
      folderId: branding._id,
    });
    firstMove.flush({ ...logo, folderId: branding._id });
    secondMove.flush(null, {
      status: 503,
      statusText: 'Unavailable',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(manager.store.moving()).toBeFalse();
    expect(manager.filtered()).toEqual([second]);
    expect(
      element.querySelector<HTMLInputElement>(
        'input[aria-label="Select Second photo"]'
      )!.checked
    ).toBeTrue();
    expect(
      element.querySelector('ngx-action-bar ngx-save-feedback')!
        .textContent
    ).toContain('Moved 1 of 2 assets');
    expect(element.querySelector('.asset-results__error')).toBeNull();
    drag();
    http.expectNone('/api/uploader/logo');
    http
      .expectOne('/api/uploader/second')
      .flush({ ...second, folderId: branding._id });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(manager.filtered()).toEqual([]);
    expect(
      element.querySelector('ngx-action-bar ngx-save-feedback')!
        .textContent
    ).toContain('Moved “Second photo” to Branding');
    expect(
      element.querySelector('.asset-library__selection-controls')!
        .textContent
    ).toContain('0 selected');
  });

  it('selects all visible assets, clears selection and prunes hidden assets before dragging', async () => {
    const { fixture, manager } = setup();
    const second = { ...logo, _id: 'second', name: 'Second photo' };
    http.expectOne('/api/uploader').flush([logo, second]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const all = () =>
      element.querySelector<HTMLInputElement>(
        'input[aria-label="Select all visible assets"]'
      )!;
    all().click();
    fixture.detectChanges();
    expect(element.textContent).toContain('2 selected');
    [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) =>
        button.textContent?.includes('Clear selection')
      )!
      .click();
    fixture.detectChanges();
    expect(element.textContent).toContain('0 selected');
    all().click();
    fixture.detectChanges();
    manager.setQuery('Second photo');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.textContent).toContain('1 selected');
    expect(
      element.querySelector('.asset-library__selection-controls')!
        .textContent
    ).toContain('1 selected');
    const dataTransfer = new DataTransfer();
    element.querySelector('ngx-asset-card')!.dispatchEvent(
      new DragEvent('dragstart', {
        dataTransfer,
        bubbles: true,
        cancelable: true,
      })
    );
    element
      .querySelector('mat-tree-node[aria-label="Branding"]')!
      .dispatchEvent(
        new DragEvent('drop', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
    http.expectNone('/api/uploader/logo');
    http
      .expectOne('/api/uploader/second')
      .flush({ ...second, folderId: branding._id });
  });

  it('dragging an unselected photo replaces the selection and moves only that photo', async () => {
    const { fixture } = setup();
    const second = { ...logo, _id: 'second', name: 'Second photo' };
    http.expectOne('/api/uploader').flush([logo, second]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element
      .querySelector<HTMLInputElement>(
        `input[aria-label="Select ${logo.name}"]`
      )!
      .click();
    fixture.detectChanges();
    const dataTransfer = new DataTransfer();
    element.querySelectorAll('ngx-asset-card')[1].dispatchEvent(
      new DragEvent('dragstart', {
        dataTransfer,
        bubbles: true,
        cancelable: true,
      })
    );
    element
      .querySelector('mat-tree-node[aria-label="Branding"]')!
      .dispatchEvent(
        new DragEvent('drop', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
    fixture.detectChanges();
    expect(
      element.querySelector<HTMLInputElement>(
        `input[aria-label="Select ${logo.name}"]`
      )!.checked
    ).toBeFalse();
    http.expectNone('/api/uploader/logo');
    http
      .expectOne('/api/uploader/second')
      .flush({ ...second, folderId: branding._id });
  });

  it('moves a dragged asset only on success, retains it on failure, and supports retry and Root drops', async () => {
    const { fixture, manager } = setup();
    http.expectOne('/api/uploader').flush([logo]);
    manager.store.setFolderFilter(null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const dragTo = (folder: string) => {
      const source =
        element.querySelector<HTMLElement>('ngx-asset-card')!;
      const target = element.querySelector<HTMLElement>(
        `mat-tree-node[aria-label="${folder}"]`
      )!;
      const dataTransfer = new DataTransfer();
      source.dispatchEvent(
        new DragEvent('dragstart', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
      target.dispatchEvent(
        new DragEvent('dragover', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
      fixture.detectChanges();
      const highlighted = target.classList.contains(
        'asset-folder-drop--active'
      );
      target.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      );
      fixture.detectChanges();
      return highlighted;
    };
    expect(dragTo('Root')).toBeFalse();
    expect(dragTo('All folders')).toBeFalse();
    http.expectNone('/api/uploader/logo');
    const external = new DataTransfer();
    external.items.add(
      new File(['external'], 'external.png', { type: 'image/png' })
    );
    element
      .querySelector('mat-tree-node[aria-label="Branding"]')!
      .dispatchEvent(
        new DragEvent('drop', {
          dataTransfer: external,
          bubbles: true,
          cancelable: true,
        })
      );
    http.expectNone('/api/uploader/logo');
    expect(dragTo('Branding')).toBeTrue();
    const failed = http.expectOne('/api/uploader/logo');
    expect(failed.request.method).toBe('PATCH');
    expect(failed.request.body).toEqual({ folderId: branding._id });
    expect(failed.request.withCredentials).toBeTrue();
    expect(manager.filtered()).toEqual([logo]);
    expect(
      element
        .querySelector('ngx-asset-card')!
        .getAttribute('draggable')
    ).toBe('false');
    expect(dragTo('Branding')).toBeFalse();
    manager.store.moveAsset({
      assetId: logo._id,
      folderId: branding._id,
    });
    http.expectNone('/api/uploader/logo');
    failed.flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(manager.filtered()).toEqual([logo]);
    expect(manager.pending().size).toBe(0);
    expect(manager.store.feedback().message).toContain(
      'Drag it again'
    );
    expect(dragTo('Branding')).toBeTrue();
    http
      .expectOne('/api/uploader/logo')
      .flush({ ...logo, folderId: branding._id });
    fixture.detectChanges();
    expect(manager.filtered()).toEqual([]);
    expect(manager.store.notice()).toContain('Branding');
    expect(manager.store.assets()[0].storageUrl).toBe(
      logo.storageUrl
    );
    manager.store.setFolderFilter(branding._id);
    fixture.detectChanges();
    expect(dragTo('Root')).toBeTrue();
    const rootMove = http.expectOne('/api/uploader/logo');
    expect(rootMove.request.body).toEqual({ folderId: null });
    rootMove.flush({ ...logo, folderId: null });
    fixture.detectChanges();
    expect(manager.filtered()).toEqual([]);
    expect(manager.store.notice()).toContain('Root');
  });

  it('places the folder tree beside the assets and filters through tree selection', async () => {
    const { fixture, manager } = setup();
    http.expectOne('/api/uploader').flush([
      { ...logo, folderId: branding._id },
      {
        ...logo,
        _id: 'root-asset',
        name: 'Root asset',
        folderId: null,
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector(
        '.asset-library__console ngx-asset-folder-browser'
      )
    ).toBeNull();
    expect(
      element.querySelector(
        '.asset-library__workspace .asset-library__inner-panel ngx-asset-folder-browser'
      )
    ).not.toBeNull();
    expect(
      element.querySelector(
        '.asset-library__workspace .asset-library__inner-panel ngx-asset-library-results'
      )
    ).not.toBeNull();
    const select = (label: string) => {
      element
        .querySelector<HTMLElement>(
          `mat-tree-node[aria-label="${label}"]`
        )!
        .click();
      fixture.detectChanges();
    };
    select('Branding');
    expect(manager.filtered().map((asset) => asset._id)).toEqual([
      'logo',
    ]);
    select('Root');
    expect(manager.filtered().map((asset) => asset._id)).toEqual([
      'root-asset',
    ]);
    select('All folders');
    expect(manager.filtered().length).toBe(2);
  });
  it('combines folder and existing filters, treats missing IDs as root and resets folders', () => {
    const { fixture, manager } = setup();
    const filed = { ...logo, folderId: branding._id };
    http
      .expectOne('/api/uploader')
      .flush([
        filed,
        record,
        { ...logo, _id: 'root', folderId: null },
      ]);
    manager.setArchiveFilter('all');
    manager.store.setFolderFilter(null);
    expect(manager.filtered().map((asset) => asset._id)).toEqual([
      'record',
      'root',
    ]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        'ngx-asset-folder-browser [aria-selected="true"]'
      ).textContent
    ).toContain('Root');
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
    http
      .expectOne('/api/uploader/folders')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    expect(manager.store.foldersError()).toContain('try again');
    expect(manager.store.folders()).toEqual([branding]);
    expect(manager.store.foldersLoading()).toBeFalse();
    manager.store.refreshFolders();
    http.expectOne('/api/uploader/folders').flush([branding]);
    expect(manager.store.foldersError()).toBe('');
    manager.store
      .writeFolder({ folder: branding }, 'Brand')
      .subscribe();
    http
      .expectOne('/api/uploader/folders/branding')
      .flush({ ...branding, name: 'Brand', version: 1 });
    expect(manager.store.folders()[0].name).toBe('Brand');
    manager.store
      .writeFolder({ folder: branding, remove: true }, '')
      .subscribe();
    http
      .expectOne('/api/uploader/folders/branding')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(manager.store.folders()).toEqual([]);
    expect(manager.store.folderFilter()).toBe('all');
  });
  it('passes the selected destination to intake without applying arbitrary dialog results', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([logo]);
    manager.store.setFolderFilter(branding._id);
    const moved = { ...logo, folderId: branding._id };
    const dialog = spyOn(
      TestBed.inject(MatDialog),
      'open'
    ).and.returnValue({
      afterClosed: () => of(undefined),
    } as ReturnType<MatDialog['open']>);
    manager.edit(undefined, true);
    expect(dialog).toHaveBeenCalledWith(
      AssetEditorComponent,
      jasmine.objectContaining({
        data: {
          asset: undefined,
          upload: true,
          folders: [branding],
          folderId: branding._id,
        },
      })
    );
    expect(manager.assets()).toEqual([logo]);
    dialog.and.returnValue({
      afterClosed: () => of(moved),
    } as ReturnType<MatDialog['open']>);
    manager.edit(logo);
    expect(manager.assets()).toEqual([logo]);
    manager.store
      .saveAsset(
        { name: moved.name, folderId: moved.folderId },
        moved._id
      )
      .subscribe();
    http.expectOne('/api/uploader/logo').flush(moved);
    expect(manager.filtered()).toEqual([moved]);
    expect(manager.assets()[0].storageUrl).toBe(logo.storageUrl);
  });
  it('opens folder deletion confirmation without applying arbitrary dialog results', () => {
    const { manager } = setup();
    http.expectOne('/api/uploader').flush([]);
    manager.store.setFolderFilter(branding._id);
    const dialog = spyOn(
      TestBed.inject(MatDialog),
      'open'
    ).and.returnValue({
      afterClosed: () => of(undefined),
    } as ReturnType<MatDialog['open']>);
    manager.deleteFolder(branding);
    expect(dialog).toHaveBeenCalledWith(
      AssetFolderEditorComponent,
      jasmine.objectContaining({
        data: { folder: branding, remove: true },
      })
    );
    expect(manager.store.folders()).toEqual([branding]);
    dialog.and.returnValue({
      afterClosed: () => of({ removed: branding._id }),
    } as ReturnType<MatDialog['open']>);
    manager.deleteFolder(branding);
    expect(manager.store.folders()).toEqual([branding]);
    manager.store
      .writeFolder({ folder: branding, remove: true }, '')
      .subscribe();
    http
      .expectOne('/api/uploader/folders/branding')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(manager.store.folders()).toEqual([]);
    expect(manager.store.folderFilter()).toBe('all');
  });
});
