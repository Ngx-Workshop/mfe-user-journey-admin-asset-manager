import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Asset, CreateAsset } from './asset.models';
export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ];
}
function tagsValidator(
  control: AbstractControl
): ValidationErrors | null {
  const tags = parseTags(String(control.value));
  return tags.length > 50 || tags.some((tag) => tag.length > 100)
    ? { tags: true }
    : null;
}
export function nonblank(control: AbstractControl): ValidationErrors | null {
  return String(control.value).trim() ? null : { required: true };
}
export function assetForm(asset?: Asset, upload = false, folderId: string | null = null) {
  return new FormGroup({
    folderId: new FormControl<string | null>(asset ? asset.folderId ?? null : folderId),
    name: new FormControl(asset?.name ?? '', {
      nonNullable: true,
      validators: [
        Validators.maxLength(120),
        ...(upload ? [] : [nonblank]),
      ],
    }),
    description: new FormControl(asset?.description ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    tags: new FormControl(asset?.tags.join(', ') ?? '', {
      nonNullable: true,
      validators: [tagsValidator],
    }),
  });
}
export function metadata(
  form: ReturnType<typeof assetForm>
): CreateAsset {
  const value = form.getRawValue();
  return {
    name: value.name.trim(),
    description: value.description.trim(),
    tags: parseTags(value.tags),
    folderId: value.folderId,
  };
}
