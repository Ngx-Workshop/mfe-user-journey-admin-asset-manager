import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterOutlet, provideRouter } from '@angular/router';
import { appConfig } from './app/app.config';
import { Routes } from './app/app.routes';

@Component({
  selector: 'mfe-user-journey-admin-asset-manager',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class StandaloneRoot {}

bootstrapApplication(StandaloneRoot, {
  providers: [...appConfig.providers, provideRouter(Routes)],
}).catch((error) => console.error(error));
