import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin-home/admin-home.component').then(
        (m) => m.AdminHomeComponent
      )
  },
  {
    path: 'medico',
    loadComponent: () =>
      import('./features/medico-home/medico-home.component').then(
        (m) => m.MedicoHomeComponent
      )
  },
  {
    path: 'dt',
    loadComponent: () =>
      import('./features/dt-home/dt-home.component').then(
        (m) => m.DtHomeComponent
      )
  },
  {
    path: 'profesor',
    redirectTo: 'dt',
    pathMatch: 'full'
  },
  {
    path: 'dt/jugador/:id',
    loadComponent: () =>
      import('./features/dt-ficha-jugador/dt-ficha-jugador.component').then(
        (m) => m.DtFichaJugadorComponent
      )
  },
  {
    path: 'dt-ficha-jugador',
    loadComponent: () =>
      import('./features/dt-ficha-jugador/dt-ficha-jugador.component').then(
        (m) => m.DtFichaJugadorComponent
      )
  }
];
