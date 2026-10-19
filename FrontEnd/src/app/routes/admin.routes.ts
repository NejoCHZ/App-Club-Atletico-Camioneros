import { Routes } from '@angular/router';
import { volverALosPortalesGuard } from '../core/auth/portales.guard';

export const ADMIN_ROUTES: Routes = [
  { path: '', title: 'Administración', loadComponent: () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent) },
  { path: 'portales', canActivate: [volverALosPortalesGuard], children: [] },
  { path: 'registro-personas', title: 'Registro de personas', loadComponent: () => import('../features/admin-registro-personas/admin-registro-personas.component').then((m) => m.AdminRegistroPersonasComponent) },
  { path: 'jugadores', title: 'Jugadores', loadComponent: () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores) },
  { path: 'jugadores/nuevo', title: 'Registrar jugador', loadComponent: () => import('../features/admin-alta-jugador/admin-alta-jugador.component').then((m) => m.AdminAltaJugadorComponent) },
  { path: 'jugadores/:id/editar', title: 'Editar jugador', loadComponent: () => import('../features/admin-editar-perfil/admin-editar-perfil').then((m) => m.AdminEditarPerfil) },
  { path: 'jugadores/:id/ficha-medica', title: 'Ficha médica', loadComponent: () => import('../features/admin-medical-page/admin-medical-page').then((m) => m.AdminMedicalPage) },
  { path: 'jugadores/:id', title: 'Perfil del jugador', loadComponent: () => import('../features/admin-ficha-jugador/admin-ficha-jugador').then((m) => m.AdminFichaJugador) },
  { path: 'categorias', title: 'Categorías', loadComponent: () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria) },
  { path: 'categorias/:id', title: 'Plantel de categoría', loadComponent: () => import('../features/admin-categoria-jugadores/admin-categoria-jugadores').then((m) => m.AdminCategoriaJugadores) },
  { path: 'categorias/:id/partidos', title: 'Partidos', loadComponent: () => import('../features/admin-partidos-categoria/admin-partidos-categoria').then((m) => m.AdminPartidosCategoria) },
  { path: 'staff', title: 'Personal', loadComponent: () => import('../features/admin-staff/admin-staff.component').then((m) => m.AdminStaffComponent) },
  { path: 'staff/nuevo', title: 'Registrar trabajador', loadComponent: () => import('../features/admin-alta-trabajador/admin-alta-trabajador.component').then((m) => m.AdminAltaTrabajadorComponent) },
  { path: 'staff/:id/editar', title: 'Editar trabajador', loadComponent: () => import('../features/admin-staff-editar-ficha/admin-staff-editar-ficha').then((m) => m.AdminStaffEditarFicha) },
  { path: 'staff/:id', title: 'Perfil del trabajador', loadComponent: () => import('../features/admin-staff-ver-ficha/admin-staff-ver-ficha').then((m) => m.AdminStaffVerFicha) },
];
