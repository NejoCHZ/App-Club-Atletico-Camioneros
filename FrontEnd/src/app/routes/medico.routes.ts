import { Routes } from '@angular/router';
import { responsiveComponent } from './responsive-component';

export const MEDICO_ROUTES: Routes = [
  { path: '', title: 'Portal médico', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
    () => import('../features/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
  ) },
  { path: 'lista-jugadores', redirectTo: 'jugadores', pathMatch: 'full' },
  { path: 'ficha-jugador/:id', redirectTo: ({ params }) => `jugadores/${params['id']}` },
  { path: 'editar-ficha/:id', redirectTo: ({ params }) => `jugadores/${params['id']}/ficha-medica` },
  { path: 'jugadores', title: 'Jugadores', loadComponent: responsiveComponent(
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
  ) },
  { path: 'jugadores/:id/ficha-medica', title: 'Editar ficha médica', loadComponent: () => import('../features/medico-editar-ficha/medico-editar-ficha.component').then((m) => m.MedicoEditarFichaComponent) },
  { path: 'jugadores/:id/asistencias', title: 'Historial de asistencia', loadComponent: () => import('../features/historial-asistencia/historial-asistencia.component').then((m) => m.HistorialAsistenciaComponent) },
  { path: 'jugadores/:id/partidos', title: 'Historial de partidos', loadComponent: () => import('../features/historial-partidos-jugador/historial-partidos-jugador.component').then((m) => m.HistorialPartidosJugadorComponent) },
  { path: 'jugadores/:id', title: 'Perfil del jugador', data: { desktopOwnShell: true }, loadComponent: responsiveComponent(
    () => import('../features/admin-ficha-jugador/admin-ficha-jugador').then((m) => m.AdminFichaJugador),
    () => import('../features/jugador-perfil/jugador-perfil.component').then((m) => m.JugadorPerfilComponent),
  ) },
  { path: 'categorias', title: 'Categorías', loadComponent: responsiveComponent(
    () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria),
    () => import('../features/admin-lista-categoria/admin-lista-categoria').then((m) => m.AdminListaCategoria),
  ) },
  { path: 'categorias/:id', title: 'Plantel de categoría', loadComponent: responsiveComponent(
    () => import('../features/medico-categoria-jugadores/medico-categoria-jugadores.component').then((m) => m.MedicoCategoriaJugadoresComponent),
    () => import('../features/admin-lista-jugadores/admin-lista-jugadores').then((m) => m.AdminListaJugadores),
  ) },
];
