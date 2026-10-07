import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  Asset,
  CreateAsset,
  UpdateAsset,
  Folder,
  CreateFolder,
  UpdateFolder,
} from '../models/asset.models';

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
