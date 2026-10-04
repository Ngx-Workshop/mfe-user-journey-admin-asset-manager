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
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class AssetApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/uploader';
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
    description: string
  ): Observable<HttpEvent<Asset>> {
    const body = new FormData();
    body.append('file', file);
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
}

export function assetError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401)
      return 'Your session has expired. Sign in again, then retry.';
    if (error.status === 403)
      return 'You do not have permission to manage these assets.';
    if (error.status === 404)
      return 'This asset no longer exists. Refresh the library.';
    if (error.status === 413)
      return 'The file is too large. Choose a file up to 25 MiB.';
    if (
      error.status === 400 &&
      error.error &&
      typeof error.error === 'object'
    ) {
      const message: unknown = error.error.message;
      if (typeof message === 'string') return message;
      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === 'string')
      )
        return message.join(' ');
    }
  }
  return 'Unable to reach the asset service. Please try again.';
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
