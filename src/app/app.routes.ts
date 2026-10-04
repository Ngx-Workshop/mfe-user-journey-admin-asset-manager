import { Route } from '@angular/router';
import App from './app';
export const Routes: Route[] = [
  { path: '', component: App, pathMatch: 'full' },
  { path: 'hello-world', component: App },
];
