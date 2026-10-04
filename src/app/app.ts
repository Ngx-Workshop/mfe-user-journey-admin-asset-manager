import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'mfe-user-journey-admin-asset-manager',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // NEVER RENDERS BECAUSE THIS IS A MFE AND IT USES ROUTES
  template: '',
})
export class App {}
export default App;
