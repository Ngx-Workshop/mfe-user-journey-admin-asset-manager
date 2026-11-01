import { TestBed } from '@angular/core/testing';
import { AssetFolderBrowserComponent } from '../../../../../../src/app/features/asset-manager/pages/library/asset-folder-browser.component';
import { Folder } from '../../../../../../src/app/features/asset-manager/models/asset.models';

const folder: Folder = {
  _id: 'branding',
  name: 'Branding',
  version: 0,
  createdAt: '2026-11-01T12:00:00Z',
  updatedAt: '2026-11-01T12:00:00Z',
};

describe('Folder tree browser', () => {
  async function setup() {
    const fixture = TestBed.createComponent(
      AssetFolderBrowserComponent
    );
    fixture.componentRef.setInput('folders', [folder]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const node = (name: string) =>
      element.querySelector<HTMLElement>(
        `mat-tree-node[aria-label="${name}"]`
      )!;
    const button = (name: string) =>
      [...element.querySelectorAll('button')].find((b) =>
        b.textContent?.includes(name)
      )!;
    return {
      fixture,
      component: fixture.componentInstance,
      element,
      node,
      button,
    };
  }

  it('selects root, named folders and all folders with visible selected state', async () => {
    const { fixture, component, node } = await setup();
    const selected = spyOn(component.selectionChange, 'emit');
    expect(node('All folders').getAttribute('aria-selected')).toBe(
      'true'
    );
    node('Root').click();
    expect(selected).toHaveBeenCalledWith(null);
    node('Branding').click();
    expect(selected).toHaveBeenCalledWith('branding');
    fixture.componentRef.setInput('selected', 'branding');
    fixture.detectChanges();
    expect(node('Branding').getAttribute('aria-selected')).toBe(
      'true'
    );
    node('All folders').click();
    expect(selected).toHaveBeenCalledWith('all');
  });

  it('collapses and expands the folder hierarchy without changing the folder filter', async () => {
    const { fixture, component, element, node } = await setup();
    const selected = spyOn(component.selectionChange, 'emit');
    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Collapse folders"]'
      )!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(node('Root')).toBeNull();
    expect(selected).not.toHaveBeenCalled();
    fixture.componentRef.setInput('folders', [
      { ...folder, name: 'Updated branding' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(node('Root')).toBeNull();
    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Expand folders"]'
      )!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(node('Updated branding')).not.toBeNull();
  });

  it('supports arrow navigation and Enter selection', async () => {
    const { fixture, component, node, element } = await setup();
    const selected = spyOn(component.selectionChange, 'emit');
    const root = node('All folders');
    root.focus();
    root.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        keyCode: 40,
        bubbles: true,
      })
    );
    fixture.detectChanges();
    expect(element.ownerDocument.activeElement).toBe(node('Root'));
    node('Root').dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        keyCode: 13,
        bubbles: true,
      })
    );
    expect(selected).toHaveBeenCalledWith(null);
  });

  it('opens actions for the hovered folder without selecting it and retains failure retry', async () => {
    const { fixture, component, element } = await setup();
    fixture.componentRef.setInput('error', 'Folder load failed.');
    fixture.detectChanges();
    const selected = spyOn(component.selectionChange, 'emit');
    const rename = spyOn(component.rename, 'emit');
    const remove = spyOn(component.remove, 'emit');
    const create = spyOn(component.create, 'emit');
    const refresh = spyOn(component.refresh, 'emit');
    async function act(label: string) {
      element
        .querySelector<HTMLButtonElement>(
          '[aria-label="Actions for Branding"]'
        )!
        .click();
      fixture.detectChanges();
      await fixture.whenStable();
      const action = [
        ...document.querySelectorAll<HTMLButtonElement>(
          '[mat-menu-item]'
        ),
      ].find((b) => b.textContent?.includes(label))!;
      action.click();
      fixture.detectChanges();
      await fixture.whenStable();
    }
    await act('Rename folder');
    await act('Delete folder');
    await act('New folder');
    element
      .querySelector<HTMLButtonElement>('[role="alert"] button')!
      .click();
    expect(rename).toHaveBeenCalledWith(folder);
    expect(remove).toHaveBeenCalledWith(folder);
    expect(create).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    expect(selected).not.toHaveBeenCalled();
    expect(
      element.querySelector('[role="alert"]')?.textContent
    ).toContain('Folder load failed');
    expect(element.textContent).not.toContain('Refresh folders');
  });

  it('offers creation without rename/delete on virtual All folders and Root nodes', async () => {
    const { fixture, element } = await setup();
    for (const name of ['All folders', 'Root']) {
      element
        .querySelector<HTMLButtonElement>(
          `[aria-label="Actions for ${name}"]`
        )!
        .click();
      fixture.detectChanges();
      await fixture.whenStable();
      const items = [
        ...document.querySelectorAll<HTMLElement>('[mat-menu-item]'),
      ];
      expect(items.map((item) => item.textContent)).toEqual([
        jasmine.stringContaining('New folder'),
      ]);
      items[0].click();
      fixture.detectChanges();
      await fixture.whenStable();
    }
  });

  it('blocks folder selection and actions while loading, retaining Root with no named folders', async () => {
    const { fixture, component, node, element } = await setup();
    fixture.componentRef.setInput('folders', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const selected = spyOn(component.selectionChange, 'emit');
    node('Root').click();
    expect(selected).not.toHaveBeenCalled();
    expect(
      [...element.querySelectorAll('button')].every((b) => b.disabled)
    ).toBeTrue();
    expect(
      element.querySelector('[role="status"]')?.textContent
    ).toContain('Loading folders');
  });
});
