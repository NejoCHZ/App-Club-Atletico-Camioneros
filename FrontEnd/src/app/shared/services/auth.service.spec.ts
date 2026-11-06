import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('posts the browser login payload through the same-origin API proxy', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    service.login({ email: 'cacc.test.dt@example.test', password: 'temporary-password' }).subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'cacc.test.dt@example.test',
      password: 'temporary-password',
    });
    request.flush({});
    http.verify();
  });

  // El token del login unico trae dos valores de rol: el id y el nombre.
  describe('rol del token del login unico', () => {
    const tokenConRoles = (roles: string[]) => {
      const payload = { 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': roles };
      const base64url = (valor: object) => btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.firma`;
    };

    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    });

    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('guarda el nombre del rol y no el id, para que el administrador vea la seleccion de portales', () => {
      const service = TestBed.inject(AuthService);

      expect(service.iniciarSesionConToken(tokenConRoles(['1', 'Administrador (Tesorero)']))).toBeTrue();

      expect(service.getRol()).toBe('Administrador (Tesorero)');
    });

    it('si el token solo trae el id, lo usa', () => {
      const service = TestBed.inject(AuthService);

      expect(service.iniciarSesionConToken(tokenConRoles(['3']))).toBeTrue();

      expect(service.getRol()).toBe('3');
    });

    it('corrige una sesion que ya estaba guardada con el id', () => {
      const service = TestBed.inject(AuthService);
      const token = tokenConRoles(['1', 'Administrador (Tesorero)']);
      (service as any).storage?.setItem('jwt_token', token);
      (service as any).storage?.setItem('user_rol', '1');

      expect(service.getRol()).toBe('Administrador (Tesorero)');
    });
  });
});
