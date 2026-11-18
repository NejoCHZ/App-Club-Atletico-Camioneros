import { Routes } from '@angular/router';
import { responsiveComponent } from './responsive-component';
import { roleGuard } from '../core/auth/auth.guard';

export const DT_ROUTES: Routes = [
  { path: '', title: 'Portal del entrenador', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
    () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
  ) },
  { path: 'jugadores', title: 'Jugadores de mis categorías', loadComponent: responsiveComponent(
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
  ) },
  { path: 'jugadores/:id/asistencias', title: 'Historial de asistencia', loadComponent: () => import('../features/historial-asistencia/historial-asistencia.component').then((m) => m.HistorialAsistenciaComponent) },
  { path: 'jugadores/:id/partidos', title: 'Historial de partidos', loadComponent: () => import('../features/historial-partidos-jugador/historial-partidos-jugador.component').then((m) => m.HistorialPartidosJugadorComponent) },
  { path: 'jugadores/:id', title: 'Perfil del jugador', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-ficha-jugador/admin-ficha-jugador').then((m) => m.AdminFichaJugador),
    () => import('../features/jugador-perfil/jugador-perfil.component').then((m) => m.JugadorPerfilComponent),
  ) },
  { path: 'jugadores/:id/ficha-medica', title: 'Ficha médica', loadComponent: () => import('../features/admin-medical-page/admin-medical-page').then((m) => m.AdminMedicalPage) },
  { path: 'categorias', title: 'Mis categorías', loadComponent: responsiveComponent(
    () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria),
    () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria),
  ) },
  { path: 'categorias/:id/partidos', title: 'Historial de partidos', data: { desktopOwnShell: true }, loadComponent: () => import('../features/admin-partidos-categoria/admin-partidos-categoria').then((m) => m.AdminPartidosCategoria) },
  { path: 'categorias/:id', title: 'Plantel de categoría', loadComponent: responsiveComponent(
    () => import('../features/dt-categoria-jugadores/dt-categoria-jugadores').then((m) => m.DtCategoriaJugadoresComponent),
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
  ) },
  {
    path: 'tomar-asistencia',
    title: 'Tomar asistencia',
    data: { roles: ['dt'], fullScreen: true },
    canActivate: [roleGuard],
    loadComponent: () => import('../features/semaforo-qr/semaforo-qr').then((m) => m.SemaforoQrComponent),
  },
];
