import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent unsupported portal roles', () => {
  function createComponent(role: string, returnUrl?: string) {
    const auth = {
      login: jasmine.createSpy('login').and.returnValue(of({})),
      getRol: () => role,
      logout: jasmine.createSpy('logout'),
    };
    const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl }) } },
        },
      ],
    });

    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.loginForm.setValue({ email: 'user@test.local', password: 'secret' });
    return { auth, component, router };
  }

  it('explains that the Administrative role has no enabled portal', () => {
    const { auth, component } = createComponent('Administrativo');

    component.onSubmit();

    expect(auth.logout).toHaveBeenCalled();
    expect(component.errorMessage).toContain('rol Administrativo');
    expect(component.errorMessage).toContain('no tiene un portal habilitado');
  });

  it('sends an administrator to portal selection after a normal login', () => {
    const { component, router } = createComponent('Administrador');

    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/admin/portales');
  });

  it('preserves a valid internal return URL for an administrator', () => {
    const returnUrl = '/admin/jugadores/42?tab=medical#history';
    const { component, router } = createComponent('Administrador', returnUrl);

    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(returnUrl);
  });

  it('keeps the default destination of non-admin portal roles', () => {
    const { component, router } = createComponent('Médico');

    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/medico');
  });

  it('rejects a protocol-relative external return URL', () => {
    const { component, router } = createComponent('Administrador', '//evil.example/path');

    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/admin/portales');
  });
});
