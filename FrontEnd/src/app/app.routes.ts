import { Routes } from '@angular/router';
import { roleGuard, roleMatchGuard } from './core/auth/auth.guard';
import { volverALosPortalesGuard } from './core/auth/portales.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', title: 'Iniciar sesión', loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent) },
  // La eleccion de portales es una sola y vive en el Portal Administrativo: esta ruta solo lleva hasta alla.
  { path: 'admin/portales', title: 'Portales', data: { roles: ['admin'] }, canMatch: [roleMatchGuard], canActivate: [roleGuard, volverALosPortalesGuard], children: [] },
  { path: 'admin', component: MainLayout, data: { roles: ['admin'] }, canMatch: [roleMatchGuard], canActivate: [roleGuard], loadChildren: () => import('./routes/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: 'coordinador', component: MainLayout, data: { roles: ['coordinador'] }, canMatch: [roleMatchGuard], canActivate: [roleGuard], loadChildren: () => import('./routes/coordinador.routes').then((m) => m.COORDINADOR_ROUTES) },
  { path: 'medico', component: MainLayout, data: { roles: ['medico'] }, canMatch: [roleMatchGuard], canActivate: [roleGuard], loadChildren: () => import('./routes/medico.routes').then((m) => m.MEDICO_ROUTES) },
  { path: 'dt', component: MainLayout, data: { roles: ['dt'] }, canMatch: [roleMatchGuard], canActivate: [roleGuard], loadChildren: () => import('./routes/dt.routes').then((m) => m.DT_ROUTES) },
  { path: 'semaforo-qr', title: 'Escáner QR', data: { roles: ['don-qr'] }, canMatch: [roleMatchGuard], canActivate: [roleGuard], loadComponent: () => import('./features/semaforo-qr/semaforo-qr').then((m) => m.SemaforoQrComponent) },

  // Legacy URLs redirect to their canonical counterpart.
  { path: 'seleccion-portales', redirectTo: 'admin/portales', pathMatch: 'full' },
  { path: 'profesor', redirectTo: 'dt', pathMatch: 'full' },
  { path: 'admin-alta-jugador', redirectTo: 'admin/jugadores/nuevo', pathMatch: 'full' },
  { path: 'admin-lista-jugadores', redirectTo: 'admin/jugadores', pathMatch: 'full' },
  { path: 'admin-ficha-jugador/:id', redirectTo: ({ params }) => `admin/jugadores/${params['id']}` },
  { path: 'admin-editar-perfil/:id', redirectTo: ({ params }) => `admin/jugadores/${params['id']}/editar` },
  { path: 'admin-lista-categoria', redirectTo: 'admin/categorias', pathMatch: 'full' },
  { path: 'admin-categoria-jugadores/:id', redirectTo: ({ params }) => `admin/categorias/${params['id']}` },
  { path: 'admin-staff', redirectTo: 'admin/staff', pathMatch: 'full' },
  { path: 'admin-alta-trabajador', redirectTo: 'admin/staff/nuevo', pathMatch: 'full' },
  { path: 'medico-lista-jugadores', redirectTo: 'medico/jugadores', pathMatch: 'full' },
  { path: 'medico-ficha-jugador/:id', redirectTo: ({ params }) => `medico/jugadores/${params['id']}` },
  { path: 'medico-editar-ficha/:id', redirectTo: ({ params }) => `medico/jugadores/${params['id']}/ficha-medica` },
  { path: 'dt-categoria', redirectTo: 'dt/categorias', pathMatch: 'full' },
  { path: 'dt-categoria-jugadores', redirectTo: 'dt/categorias', pathMatch: 'full' },
  { path: 'coordinador-seleccion-categorias', redirectTo: 'coordinador/categorias', pathMatch: 'full' },
  { path: 'coordinador-lista-jugadores', redirectTo: 'coordinador/jugadores', pathMatch: 'full' },
  { path: 'acceso-denegado', title: 'Acceso denegado', loadComponent: () => import('./features/route-status/route-status').then((m) => m.RouteStatusComponent), data: { code: '403', title: 'Acceso denegado', message: 'No tenés permisos para acceder a esta pantalla.' } },
  { path: '**', title: 'Página no encontrada', loadComponent: () => import('./features/route-status/route-status').then((m) => m.RouteStatusComponent), data: { code: '404', title: 'Página no encontrada', message: 'La dirección solicitada no existe.' } },
];
