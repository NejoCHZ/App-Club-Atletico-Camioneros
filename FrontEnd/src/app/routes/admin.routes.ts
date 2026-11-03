import { Routes } from '@angular/router';
import { responsiveComponent } from './responsive-component';

export const ADMIN_ROUTES: Routes = [
  { path: '', title: 'Administración', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent) },
  { path: 'lista-jugadores', redirectTo: 'jugadores', pathMatch: 'full' },
  { path: 'ficha-jugador/:id', redirectTo: ({ params }) => `jugadores/${params['id']}` },
  { path: 'editar-perfil/:id', redirectTo: ({ params }) => `jugadores/${params['id']}/editar` },
  { path: 'registro-personas', title: 'Registro de personas', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-registro-personas/admin-registro-personas.component').then((m) => m.AdminRegistroPersonasComponent) },
  { path: 'jugadores', title: 'Jugadores', loadComponent: () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores) },
  { path: 'jugadores/nuevo', title: 'Registrar jugador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-alta-jugador/admin-alta-jugador.component').then((m) => m.AdminAltaJugadorComponent) },
  { path: 'jugadores/:id/editar', title: 'Editar jugador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-editar-perfil/admin-editar-perfil').then((m) => m.AdminEditarPerfil) },
  { path: 'jugadores/:id/ficha-medica', title: 'Ficha médica', loadComponent: () => import('../features/admin-medical-page/admin-medical-page').then((m) => m.AdminMedicalPage) },
  { path: 'jugadores/:id/asistencias', title: 'Historial de asistencia', loadComponent: () => import('../features/historial-asistencia/historial-asistencia.component').then((m) => m.HistorialAsistenciaComponent) },
  { path: 'jugadores/:id/partidos', title: 'Historial de partidos', loadComponent: () => import('../features/historial-partidos-jugador/historial-partidos-jugador.component').then((m) => m.HistorialPartidosJugadorComponent) },
  { path: 'jugadores/:id', title: 'Perfil del jugador', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-ficha-jugador/admin-ficha-jugador').then((m) => m.AdminFichaJugador),
    () => import('../features/jugador-perfil/jugador-perfil.component').then((m) => m.JugadorPerfilComponent),
  ) },
  { path: 'categorias', title: 'Categorías', loadComponent: () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria) },
  { path: 'categorias/:id', title: 'Plantel de categoría', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-categoria-jugadores/admin-categoria-jugadores').then((m) => m.AdminCategoriaJugadores) },
  { path: 'categorias/:id/partidos', title: 'Partidos', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-partidos-categoria/admin-partidos-categoria').then((m) => m.AdminPartidosCategoria) },
  { path: 'staff', title: 'Personal', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-staff/admin-staff.component').then((m) => m.AdminStaffComponent) },
  { path: 'staff/nuevo', title: 'Registrar trabajador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-alta-trabajador/admin-alta-trabajador.component').then((m) => m.AdminAltaTrabajadorComponent) },
  { path: 'staff/:id/editar', title: 'Editar trabajador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-staff-editar-ficha/admin-staff-editar-ficha').then((m) => m.AdminStaffEditarFicha) },
  { path: 'staff/:id', title: 'Perfil del trabajador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-staff-ver-ficha/admin-staff-ver-ficha').then((m) => m.AdminStaffVerFicha) },
];
