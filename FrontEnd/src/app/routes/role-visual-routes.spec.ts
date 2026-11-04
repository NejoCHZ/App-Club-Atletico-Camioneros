import { DT_ROUTES } from './dt.routes';
import { MEDICO_ROUTES } from './medico.routes';
import { ADMIN_ROUTES } from './admin.routes';
import { COORDINADOR_ROUTES } from './coordinador.routes';

const setMobileViewport = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches }) as MediaQueryList,
  });
};

describe('role-specific visual routes', () => {
  beforeEach(() => setMobileViewport(true));

  it('uses the Admin mobile visual language while preserving Médico-specific workflows', async () => {
    const expected: Record<string, string> = {
      '': 'AdminHomeComponent',
      jugadores: 'AdminListaJugadores',
      'jugadores/:id': 'AdminFichaJugador',
      'jugadores/:id/ficha-medica': 'MedicoEditarFichaComponent',
      categorias: 'AdminListaCategoria',
      'categorias/:id': 'MedicoCategoriaJugadoresComponent',
    };
    for (const [path, componentName] of Object.entries(expected)) {
      const route = MEDICO_ROUTES.find(candidate => candidate.path === path);
      expect(route?.loadComponent).toBeDefined();
      expect((await (route!.loadComponent!() as Promise<any>)).name).toMatch(new RegExp('^' + componentName));
    }
  });

  it('uses the Admin mobile visual language while preserving DT-specific roster workflows', async () => {
    const expected: Record<string, string> = {
      '': 'AdminHomeComponent',
      jugadores: 'AdminListaJugadores',
      'jugadores/:id': 'AdminFichaJugador',
      'jugadores/:id/ficha-medica': 'AdminFichaJugador',
      categorias: 'AdminListaCategoria',
      'categorias/:id': 'DtCategoriaJugadoresComponent',
    };
    for (const [path, componentName] of Object.entries(expected)) {
      const route = DT_ROUTES.find(candidate => candidate.path === path);
      expect(route?.loadComponent).toBeDefined();
      expect((await (route!.loadComponent!() as Promise<any>)).name).toMatch(new RegExp('^' + componentName));
    }
  });

  it('restores the shared legacy presentations outside mobile', async () => {
    setMobileViewport(false);
    const expected = [
      [MEDICO_ROUTES, '', 'AdminHomeComponent'],
      [MEDICO_ROUTES, 'jugadores', 'AdminListaJugadores'],
      [DT_ROUTES, '', 'AdminHomeComponent'],
      [DT_ROUTES, 'categorias', 'AdminListaCategoria'],
    ] as const;

    for (const [routes, path, componentName] of expected) {
      const route = routes.find((candidate) => candidate.path === path)!;
      expect((await (route.loadComponent!() as Promise<any>)).name).toMatch(new RegExp('^' + componentName));
    }
  });

  it('exposes attendance history before the player detail catchall for every player-viewing role', async () => {
    for (const roleRoutes of [ADMIN_ROUTES, COORDINADOR_ROUTES, MEDICO_ROUTES, DT_ROUTES]) {
      const historyIndex = roleRoutes.findIndex(route => route.path === 'jugadores/:id/asistencias');
      const playerIndex = roleRoutes.findIndex(route => route.path === 'jugadores/:id');
      expect(historyIndex).toBeGreaterThanOrEqual(0);
      expect(historyIndex).toBeLessThan(playerIndex);
      expect(roleRoutes[historyIndex].data?.['desktopOwnShell']).not.toBeTrue();
      expect((await (roleRoutes[historyIndex].loadComponent!() as Promise<any>)).name).toMatch(/^HistorialAsistenciaComponent/);
    }
  });
});

