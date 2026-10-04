import { assetForm, metadata } from './asset-form';
describe('asset metadata form', () => {
  it('rejects blank names and service length limits', () => {
    const form = assetForm();
    form.controls.name.setValue('   ');
    expect(form.invalid).toBeTrue();
    form.controls.name.setValue('a'.repeat(121));
    expect(form.invalid).toBeTrue();
    form.controls.name.setValue('Valid');
    form.controls.description.setValue('a'.repeat(2001));
    expect(form.invalid).toBeTrue();
    form.controls.description.setValue('');
    form.controls.tags.setValue('a'.repeat(101));
    expect(form.invalid).toBeTrue();
    form.controls.tags.setValue(
      Array.from({ length: 51 }, (_, i) => `tag${i}`).join(',')
    );
    expect(form.invalid).toBeTrue();
  });
  it('trims and deduplicates tags while preserving explicit clears', () => {
    const form = assetForm();
    form.setValue({
      name: ' Logo ',
      description: ' ',
      tags: ' brand, workshop,brand, ',
      folderId: null,
    });
    expect(metadata(form)).toEqual({
      name: 'Logo',
      description: '',
      tags: ['brand', 'workshop'],
      folderId: null,
    });
    form.controls.tags.setValue('');
    expect(metadata(form).tags).toEqual([]);
  });
  it('allows optional upload names but retains length validation', () => {
    const form = assetForm(undefined, true);
    expect(form.valid).toBeTrue();
    form.controls.name.setValue('a'.repeat(121));
    expect(form.invalid).toBeTrue();
  });
});
