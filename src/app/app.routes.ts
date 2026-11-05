import { Route } from '@angular/router';
import App from './app';
import { AssetUploadPage, canLeaveAssetUpload } from './features/asset-manager/pages/upload/asset-upload-page';
export const Routes: Route[] = [
  { path: 'upload', component: AssetUploadPage, canDeactivate: [canLeaveAssetUpload] },
  { path: '', component: App, pathMatch: 'full' },
  { path: 'hello-world', component: App },
];
