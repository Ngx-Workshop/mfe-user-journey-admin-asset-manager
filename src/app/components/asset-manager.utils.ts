import { Asset } from '../services/asset.models';
import { AssetTypeFilter } from './asset-manager.models';

export function mediaCategory(asset: Asset): Exclude<
  AssetTypeFilter,
  'all'
> {
  const type = asset.mediaType ?? '';
  if (!asset.originalFilename) return 'record';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
}
