import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { roleGuard, roleMatchGuard } from './auth.guard';

describe('authorization guards', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['estaAutenticado', 'getRol', 'logout']);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'getCurrentNavigation']);
    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows an administrator into a role-specific portal', () => {
    auth.estaAutenticado.and.returnValue(true);
    auth.getRol.and.returnValue('Administrador (Tesorero)');

    const result = TestBed.runInInjectionContext(() => roleGuard(
      { data: { roles: ['medico'] } } as any,
      { url: '/medico/jugadores/42' } as any
    ));

    expect(result).toBeTrue();
  });

  it('keeps the complete attempted deep link when canMatch redirects to login', () => {
    auth.estaAutenticado.and.returnValue(false);
    router.getCurrentNavigation.and.returnValue({
      extractedUrl: { toString: () => '/admin/jugadores/42?tab=medical#history' }
    } as any);

    TestBed.runInInjectionContext(() => roleMatchGuard(
      { data: { roles: ['admin'] } } as any,
      [{ path: 'admin' }] as any
    ));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/admin/jugadores/42?tab=medical#history' }
    });
  });

  it('rejects a non-admin role from another portal', () => {
    auth.estaAutenticado.and.returnValue(true);
    auth.getRol.and.returnValue('medico');

    TestBed.runInInjectionContext(() => roleGuard(
      { data: { roles: ['coordinador'] } } as any,
      { url: '/coordinador/categorias' } as any
    ));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/acceso-denegado']);
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('clears an authenticated session with an unknown role and returns to login', () => {
    auth.estaAutenticado.and.returnValue(true);
    auth.getRol.and.returnValue('rol-inexistente');

    TestBed.runInInjectionContext(() => roleGuard(
      { data: { roles: ['admin'] } } as any,
      { url: '/admin/jugadores' } as any
    ));

    expect(auth.logout).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('clears an authenticated session without a role and returns to login', () => {
    auth.estaAutenticado.and.returnValue(true);
    auth.getRol.and.returnValue(null);

    TestBed.runInInjectionContext(() => roleGuard(
      { data: { roles: ['medico'] } } as any,
      { url: '/medico' } as any
    ));

    expect(auth.logout).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
