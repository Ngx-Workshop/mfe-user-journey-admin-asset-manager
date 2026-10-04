import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AssetManagerComponent } from './components/asset-manager.component';
@Component({
  selector: 'mfe-user-journey-admin-asset-manager',
  imports: [AssetManagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ngx-asset-manager />',
})
export class App {}
export default App;
