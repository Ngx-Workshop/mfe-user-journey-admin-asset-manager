import { Route } from '@angular/router';
import App from './app';

export const Routes: Route[] = [
  { path: '', redirectTo: 'hello-world', pathMatch: 'full' },
  {
    path: 'hello-world',
    component: App,
  },
];
