import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/hero-list/hero-list.component').then(
        (m) => m.HeroListComponent
      ),
  },
  {
    path: 'heroes',
    loadComponent: () =>
      import('./components/hero-list/hero-list.component').then(
        (m) => m.HeroListComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
