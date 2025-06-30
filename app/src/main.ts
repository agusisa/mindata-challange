import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { loadingInterceptor } from './app/interceptors/loading.interceptor';

const routes = [
  {
    path: '',
    loadComponent: () =>
      import('./app/components/hero-list/hero-list.component').then(
        (m) => m.HeroListComponent
      ),
  },
  {
    path: 'heroes',
    loadComponent: () =>
      import('./app/components/hero-list/hero-list.component').then(
        (m) => m.HeroListComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor])),
  ],
}).catch((err) => console.error(err));
