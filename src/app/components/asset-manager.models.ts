export type ArchiveFilter = 'active' | 'archived' | 'all';
export type AssetTypeFilter =
  | 'all'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'record';
export type StorageFilter =
  | 'all'
  | 'PENDING_STORAGE'
  | 'READY'
  | 'STORAGE_FAILED';
import type { Folder } from '../services/asset-api.service';

export type FolderFilter = 'all' | null | string;
export type FolderResult = { saved: Folder } | { removed: string };
export type FolderEditorData =
  | { folder?: Folder; remove?: false }
  | { folder: Folder; remove: true };
