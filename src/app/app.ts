import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AssetManagerComponent } from './features/asset-manager/pages/library/asset-manager.component';
@Component({
  selector: 'mfe-user-journey-admin-asset-manager',
  imports: [AssetManagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ngx-asset-manager />',
})
export class App {}
export default App;
