import { routes } from './app.routes';
import { volverALosPortalesGuard } from './core/auth/portales.guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { ADMIN_ROUTES } from './routes/admin.routes';
import { MEDICO_ROUTES } from './routes/medico.routes';
import { COORDINADOR_ROUTES } from './routes/coordinador.routes';

describe('critical application routes', () => {
  it('protects every role portal with both matching and activation guards', () => {
    for (const path of ['admin', 'coordinador', 'medico', 'dt', 'semaforo-qr']) {
      const route = routes.find((candidate) => candidate.path === path);
      expect(route).withContext(`route ${path}`).toBeDefined();
      expect(route?.canMatch?.length).withContext(`canMatch ${path}`).toBeGreaterThan(0);
      expect(route?.canActivate?.length).withContext(`canActivate ${path}`).toBeGreaterThan(0);
    }
  });

  it('keeps access denied before the terminal wildcard route', () => {
    const deniedIndex = routes.findIndex((route) => route.path === 'acceso-denegado');
    const wildcardIndex = routes.findIndex((route) => route.path === '**');

    expect(deniedIndex).toBeGreaterThanOrEqual(0);
    expect(wildcardIndex).toBe(routes.length - 1);
    expect(deniedIndex).toBeLessThan(wildcardIndex);
  });

  it('sends the protected portal selector route to the single selector of the Administrativo, outside MainLayout', () => {
    const portalIndex = routes.findIndex((route) => route.path === 'admin/portales');
    const adminIndex = routes.findIndex((route) => route.path === 'admin');
    const route = routes[portalIndex];

    expect(portalIndex).toBeGreaterThanOrEqual(0);
    expect(portalIndex).toBeLessThan(adminIndex);
    expect(route.component).not.toBe(MainLayout);
    expect(route.loadComponent).toBeUndefined();      // este portal no tiene selector propio
    expect(route.canMatch?.length).toBeGreaterThan(0);
    expect(route.canActivate).toContain(volverALosPortalesGuard);
    expect(route.data?.['roles']).toEqual(['admin']);
    expect(ADMIN_ROUTES.some((candidate) => candidate.path === 'portales')).toBeFalse();
  });

  it('preserves the legacy portal selector redirect', () => {
    const route = routes.find((candidate) => candidate.path === 'seleccion-portales');
    expect(route?.redirectTo).toBe('admin/portales');
    expect(route?.pathMatch).toBe('full');
  });

  it('preserves nested legacy player routes used by older responsive views', () => {
    expect(ADMIN_ROUTES.find((route) => route.path === 'lista-jugadores')?.redirectTo)
      .toBe('jugadores');
    expect(ADMIN_ROUTES.find((route) => route.path === 'editar-perfil/:id')?.redirectTo)
      .toBeDefined();
    expect(MEDICO_ROUTES.find((route) => route.path === 'lista-jugadores')?.redirectTo)
      .toBe('jugadores');
    expect(MEDICO_ROUTES.find((route) => route.path === 'editar-ficha/:id')?.redirectTo)
      .toBeDefined();
  });

  it('keeps coordinator staff routes canonical and redirects every legacy URL', () => {
    for (const path of ['staff', 'staff/perfil', 'staff/editar']) {
      expect(COORDINADOR_ROUTES.find((route) => route.path === path)?.loadComponent)
        .withContext(`canonical coordinator route ${path}`)
        .toBeDefined();
    }

    const redirects: Record<string, string> = {
      'visualizar-staff': 'staff',
      'visualizar-perfil-staff': 'staff/perfil',
      'editar-staff': 'staff/editar',
      'visualizar-perfil': 'jugadores',
      'visualizar-plantel': 'categorias',
    };
    for (const [legacy, canonical] of Object.entries(redirects)) {
      expect(COORDINADOR_ROUTES.find((route) => route.path === legacy)?.redirectTo)
        .withContext(`legacy coordinator route ${legacy}`)
        .toBe(canonical);
    }
  });
});
