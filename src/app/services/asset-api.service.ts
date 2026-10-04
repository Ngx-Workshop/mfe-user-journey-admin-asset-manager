import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { components } from '@tmdjr/service-uploader-contracts';
import { Observable } from 'rxjs';

export type Asset = components['schemas']['AssetDto'];
export type CreateAsset = components['schemas']['CreateAssetDto'];
export type UpdateAsset = components['schemas']['UpdateAssetDto'];
export type Folder = components['schemas']['FolderDto'];
export type CreateFolder = components['schemas']['CreateFolderDto'];
export type UpdateFolder = components['schemas']['UpdateFolderDto'];
export type AssetErrorContext = 'asset' | 'asset-save' | 'upload' | 'folder-save' | 'folder-delete' | 'folder-list';
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class AssetApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/uploader';
  listFolders(): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.base}/folders`, {
      withCredentials: true,
    });
  }
  createFolder(dto: CreateFolder): Observable<Folder> {
    return this.http.post<Folder>(`${this.base}/folders`, dto, {
      withCredentials: true,
    });
  }
  updateFolder(id: string, dto: UpdateFolder): Observable<Folder> {
    return this.http.patch<Folder>(this.folderUrl(id), dto, {
      withCredentials: true,
    });
  }
  removeFolder(id: string): Observable<void> {
    return this.http.delete<void>(this.folderUrl(id), {
      withCredentials: true,
    });
  }
  list(): Observable<Asset[]> {
    return this.http.get<Asset[]>(this.base, {
      withCredentials: true,
    });
  }
  get(id: string): Observable<Asset> {
    return this.http.get<Asset>(this.url(id), {
      withCredentials: true,
    });
  }
  create(dto: CreateAsset): Observable<Asset> {
    return this.http.post<Asset>(this.base, dto, {
      withCredentials: true,
    });
  }
  update(id: string, dto: UpdateAsset): Observable<Asset> {
    return this.http.patch<Asset>(this.url(id), dto, {
      withCredentials: true,
    });
  }
  archive(id: string, archived: boolean): Observable<Asset> {
    return this.http.patch<Asset>(
      `${this.url(id)}/${archived ? 'archive' : 'unarchive'}`,
      {},
      { withCredentials: true }
    );
  }
  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(id), {
      withCredentials: true,
    });
  }
  upload(
    file: File,
    name: string,
    description: string,
    folderId: string | null = null
  ): Observable<HttpEvent<Asset>> {
    const body = new FormData();
    body.append('file', file);
    if (folderId !== null) body.append('folderId', folderId);
    if (name.trim()) body.append('name', name.trim());
    if (description.trim())
      body.append('description', description.trim());
    return this.http.post<Asset>(`${this.base}/upload`, body, {
      withCredentials: true,
      observe: 'events',
      reportProgress: true,
    });
  }
  private url(id: string): string {
    return `${this.base}/${encodeURIComponent(id)}`;
  }
  private folderUrl(id: string): string {
    return `${this.base}/folders/${encodeURIComponent(id)}`;
  }
}

type AssetErrorHandler = (
  error: HttpErrorResponse,
  context: AssetErrorContext
) => string | undefined;

const CONFLICT_ERROR_MESSAGES: Partial<
  Record<AssetErrorContext | 'default', string>
> = {
  upload:
    'Identical file content already exists in the library, possibly in another folder or archived. Reuse the existing asset or choose a different file.',
  'folder-save':
    'A folder with this name already exists. Names are case-insensitive. Choose a different name.',
  'folder-delete':
    'This folder contains assets, including possibly archived assets. Move or delete all its assets before deleting the folder.',
  default:
    'This change conflicts with the current asset state. Refresh the library and retry.',
};

const NOT_FOUND_ERROR_MESSAGES: Partial<
  Record<AssetErrorContext | 'default', string>
> = {
  'asset-save':
    'This asset or destination folder no longer exists. Refresh the library and folders before retrying.',
  'folder-list':
    'Folder management is unavailable. Check the uploader service and gateway, then refresh folders.',
  asset: 'This asset no longer exists. Refresh the library.',
  default:
    'This folder no longer exists. Refresh the folders and choose an existing destination or Root.',
};

const HTTP_ERROR_HANDLERS: Partial<Record<number, AssetErrorHandler>> = {
  400: (error) => {
    if (!error.error || typeof error.error !== 'object') return undefined;
    const message: unknown = error.error.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((item) => typeof item === 'string'))
      return message.join(' ');
    return undefined;
  },
  401: () => 'Your session has expired. Sign in again, then retry.',
  403: () => 'You do not have permission to manage these assets.',
  404: (_error, context) =>
    NOT_FOUND_ERROR_MESSAGES[context] ?? NOT_FOUND_ERROR_MESSAGES.default,
  409: (_error, context) =>
    CONFLICT_ERROR_MESSAGES[context] ?? CONFLICT_ERROR_MESSAGES.default,
  413: () => 'The file is too large. Choose a file up to 25 MiB.',
  503: (_error, context) =>
    context === 'upload'
      ? 'File storage failed or is unavailable. Your file is still selected; retry the upload.'
      : undefined,
};

export function assetError(error: unknown, context: AssetErrorContext = 'asset'): string {
  if (!(error instanceof HttpErrorResponse))
    return 'Unable to reach the asset service. Please try again.';
  return (
    HTTP_ERROR_HANDLERS[error.status]?.(error, context) ??
    'Unable to reach the asset service. Please try again.'
  );
}

export function fileError(file: File): string | null {
  if (!file.size) return 'Choose a nonempty file.';
  if (file.size > MAX_FILE_BYTES)
    return 'Choose a file up to 25 MiB.';
  if (!file.name || file.name.length > 255)
    return 'The filename must be 1–255 characters.';
  return null;
}
export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return 'No file';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function folderLabel(folderId: string | null | undefined, folders: readonly Folder[]): string {
  return folderId == null
    ? 'Root'
    : folders.find((folder) => folder._id === folderId)?.name ?? `Unavailable folder (${folderId})`;
}
