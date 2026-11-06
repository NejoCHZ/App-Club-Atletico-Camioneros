import { Routes } from '@angular/router';
import { responsiveComponent } from './responsive-component';

export const COORDINADOR_ROUTES: Routes = [
  { path: '', title: 'Coordinación', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
    () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
  ) },
  { path: 'jugadores', title: 'Jugadores', loadComponent: responsiveComponent(
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
  ) },
  { path: 'jugadores/:id/asistencias', title: 'Historial de asistencia', loadComponent: () => import('../features/historial-asistencia/historial-asistencia.component').then((m) => m.HistorialAsistenciaComponent) },
  { path: 'jugadores/:id/partidos', title: 'Historial de partidos', loadComponent: () => import('../features/historial-partidos-jugador/historial-partidos-jugador.component').then((m) => m.HistorialPartidosJugadorComponent) },
  { path: 'jugadores/:id', title: 'Perfil del jugador', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-ficha-jugador/admin-ficha-jugador').then((m) => m.AdminFichaJugador),
    () => import('../features/jugador-perfil/jugador-perfil.component').then((m) => m.JugadorPerfilComponent),
  ) },
  { path: 'jugadores/:id/ficha-medica', title: 'Ficha médica', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/coordinador-medical-page/coordinador-medical-page').then((m) => m.CoordinadorMedicalPage),
    () => import('../features/jugador-perfil/jugador-perfil.component').then((m) => m.JugadorPerfilComponent),
  ) },
  { path: 'staff/perfil', title: 'Perfil del trabajador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/coordinador-visualizar-perfil-staff/coordinador-visualizar-perfil-staff').then((m) => m.CoordinadorVisualizarPerfilStaff) },
  { path: 'staff/editar', title: 'Editar trabajador', data: { desktopOwnShell: true }, loadComponent: () => import('../features/coordinador-editar-staff/coordinador-editar-staff').then((m) => m.CoordinadorEditarStaff) },
  { path: 'staff', title: 'Personal', data: { desktopOwnShell: true }, loadComponent: () => import('../features/coordinador-visualizar-staff/coordinador-visualizar-staff').then((m) => m.CoordinadorVisualizarStaff) },
  { path: 'visualizar-staff', redirectTo: 'staff', pathMatch: 'full' },
  { path: 'visualizar-perfil-staff', redirectTo: 'staff/perfil', pathMatch: 'full' },
  { path: 'editar-staff', redirectTo: 'staff/editar', pathMatch: 'full' },
  { path: 'visualizar-perfil', redirectTo: 'jugadores', pathMatch: 'full' },
  { path: 'visualizar-plantel', redirectTo: 'categorias', pathMatch: 'full' },
  { path: 'categorias', title: 'Categorías', loadComponent: responsiveComponent(
    () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria),
    () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria),
  ) },
  { path: 'categorias/:id', title: 'Editar plantel de categoría', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/coordinador-visualizar-plantel/coordinador-visualizar-plantel').then((m) => m.CoordinadorVisualizarPlantel),
    () => import('../features/admin-categoria-jugadores/admin-categoria-jugadores').then((m) => m.AdminCategoriaJugadores),
  ) },
];
