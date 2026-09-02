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
    path: 'admin/alta-jugador',
    loadComponent: () =>
      import('./features/admin-alta-jugador/admin-alta-jugador.component').then(
        (m) => m.AdminAltaJugadorComponent
      )
  },
  {
    path: 'admin-alta-jugador',
    loadComponent: () =>
      import('./features/admin-alta-jugador/admin-alta-jugador.component').then(
        (m) => m.AdminAltaJugadorComponent
      )
  },
  {
    path: 'admin/lista-jugadores',
    loadComponent: () =>
      import('./features/admin-lista-jugadores/admin-lista-jugadores').then(
        (m) => m.AdminListaJugadores
      )
  },
  {
    path: 'admin/jugador/:id',
    loadComponent: () =>
      import('./features/admin-ficha-jugador/admin-ficha-jugador').then(
        (m) => m.AdminFichaJugador
      )
  },
  {
    path: 'admin/ficha-jugador/:id',
    loadComponent: () =>
      import('./features/admin-ficha-jugador/admin-ficha-jugador').then(
        (m) => m.AdminFichaJugador
      )
  },
  {
    path: 'admin-ficha-jugador/:id',
    loadComponent: () =>
      import('./features/admin-ficha-jugador/admin-ficha-jugador').then(
        (m) => m.AdminFichaJugador
      )
  },
  {
    path: 'admin-ficha-jugador',
    loadComponent: () =>
      import('./features/admin-ficha-jugador/admin-ficha-jugador').then(
        (m) => m.AdminFichaJugador
      )
  },
  {
    path: 'admin/editar-perfil/:id',
    loadComponent: () =>
      import('./features/admin-editar-perfil/admin-editar-perfil').then(
        (m) => m.AdminEditarPerfil
      )
  },
  {
    path: 'admin/editar-perfil',
    loadComponent: () =>
      import('./features/admin-editar-perfil/admin-editar-perfil').then(
        (m) => m.AdminEditarPerfil
      )
  },
  {
    path: 'admin-editar-perfil/:id',
    loadComponent: () =>
      import('./features/admin-editar-perfil/admin-editar-perfil').then(
        (m) => m.AdminEditarPerfil
      )
  },
  {
    path: 'admin-editar-perfil',
    loadComponent: () =>
      import('./features/admin-editar-perfil/admin-editar-perfil').then(
        (m) => m.AdminEditarPerfil
      )
  },
  {
    path: 'admin-lista-jugadores',
    loadComponent: () =>
      import('./features/admin-lista-jugadores/admin-lista-jugadores').then(
        (m) => m.AdminListaJugadores
      )
  },
  {
    path: 'admin/categorias',
    loadComponent: () =>
      import('./features/admin-lista-categoria/admin-lista-categoria').then(
        (m) => m.AdminListaCategoria
      )
  },
  {
    path: 'admin/categoria/:id/jugadores',
    loadComponent: () =>
      import('./features/admin-categoria-jugadores/admin-categoria-jugadores').then(
        (m) => m.AdminCategoriaJugadores
      )
  },
  {
    path: 'admin-categoria-jugadores/:id',
    loadComponent: () =>
      import('./features/admin-categoria-jugadores/admin-categoria-jugadores').then(
        (m) => m.AdminCategoriaJugadores
      )
  },
  {
    path: 'admin-categoria-jugadores',
    loadComponent: () =>
      import('./features/admin-categoria-jugadores/admin-categoria-jugadores').then(
        (m) => m.AdminCategoriaJugadores
      )
  },
  {
    path: 'admin/lista-categoria',
    loadComponent: () =>
      import('./features/admin-lista-categoria/admin-lista-categoria').then(
        (m) => m.AdminListaCategoria
      )
  },
  {
    path: 'admin-lista-categoria',
    loadComponent: () =>
      import('./features/admin-lista-categoria/admin-lista-categoria').then(
        (m) => m.AdminListaCategoria
      )
  },
  {
    path: 'admin/staff/ver-ficha/:id',
    loadComponent: () =>
      import('./features/admin-staff-ver-ficha/admin-staff-ver-ficha').then(
        (m) => m.AdminStaffVerFicha
      )
  },
  {
    path: 'admin/staff/ver-ficha',
    loadComponent: () =>
      import('./features/admin-staff-ver-ficha/admin-staff-ver-ficha').then(
        (m) => m.AdminStaffVerFicha
      )
  },
  {
    path: 'admin-staff-ver-ficha/:id',
    loadComponent: () =>
      import('./features/admin-staff-ver-ficha/admin-staff-ver-ficha').then(
        (m) => m.AdminStaffVerFicha
      )
  },
  {
    path: 'admin-staff-ver-ficha',
    loadComponent: () =>
      import('./features/admin-staff-ver-ficha/admin-staff-ver-ficha').then(
        (m) => m.AdminStaffVerFicha
      )
  },
  {
    path: 'admin/staff/editar-ficha/:id',
    loadComponent: () =>
      import('./features/admin-staff-editar-ficha/admin-staff-editar-ficha').then(
        (m) => m.AdminStaffEditarFicha
      )
  },
  {
    path: 'admin/staff/editar-ficha',
    loadComponent: () =>
      import('./features/admin-staff-editar-ficha/admin-staff-editar-ficha').then(
        (m) => m.AdminStaffEditarFicha
      )
  },
  {
    path: 'admin-staff-editar-ficha/:id',
    loadComponent: () =>
      import('./features/admin-staff-editar-ficha/admin-staff-editar-ficha').then(
        (m) => m.AdminStaffEditarFicha
      )
  },
  {
    path: 'admin-staff-editar-ficha',
    loadComponent: () =>
      import('./features/admin-staff-editar-ficha/admin-staff-editar-ficha').then(
        (m) => m.AdminStaffEditarFicha
      )
  },
  {
    path: 'admin/staff',
    loadComponent: () =>
      import('./features/admin-staff/admin-staff.component').then(
        (m) => m.AdminStaffComponent
      )
  },
  {
    path: 'admin-staff',
    loadComponent: () =>
      import('./features/admin-staff/admin-staff.component').then(
        (m) => m.AdminStaffComponent
      )
  },
  {
    path: 'admin/alta-trabajador',
    loadComponent: () =>
      import('./features/admin-alta-trabajador/admin-alta-trabajador.component').then(
        (m) => m.AdminAltaTrabajadorComponent
      )
  },
  {
    path: 'admin-alta-trabajador',
    loadComponent: () =>
      import('./features/admin-alta-trabajador/admin-alta-trabajador.component').then(
        (m) => m.AdminAltaTrabajadorComponent
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
  },
  {
    path: 'dt/categorias',
    loadComponent: () =>
      import('./features/dt-categoria/dt-categoria.component').then(
        (m) => m.DtCategoriaComponent
      )
  },
  {
    path: 'dt/categoria',
    loadComponent: () =>
      import('./features/dt-categoria/dt-categoria.component').then(
        (m) => m.DtCategoriaComponent
      )
  },
  {
    path: 'dt-categoria',
    loadComponent: () =>
      import('./features/dt-categoria/dt-categoria.component').then(
        (m) => m.DtCategoriaComponent
      )
  },
  {
    path: 'dt-categoria-jugadores',
    loadComponent: () =>
      import('./features/dt-categoria-jugadores/dt-categoria-jugadores').then(
        (m) => m.DtCategoriaJugadoresComponent
      )
  },
  {
    path: 'dt/categoria-jugadores',
    loadComponent: () =>
      import('./features/dt-categoria-jugadores/dt-categoria-jugadores').then(
        (m) => m.DtCategoriaJugadoresComponent
      )
  },
  {
    path: 'dt-editar-historial',
    loadComponent: () =>
      import('./features/dt-editar-historial/dt-editar-historial').then(
        (m) => m.DtEditarHistorialComponent
      )
  },
  {
    path: 'dt/editar-historial',
    loadComponent: () =>
      import('./features/dt-editar-historial/dt-editar-historial').then(
        (m) => m.DtEditarHistorialComponent
      )
  }
];
