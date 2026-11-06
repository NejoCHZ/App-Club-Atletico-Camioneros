import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

const ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function token(payload: Record<string, unknown>): string {
  const codificar = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar(payload)}.firma`;
}

describe('AuthService con la sesión del Portal Administrativo', () => {
  let service: AuthService;
  const enUnaHora = Math.floor(Date.now() / 1000) + 3600;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(AuthService);
  });

  it('inicia sesión con un token de un rol deportivo', () => {
    expect(service.iniciarSesionConToken(token({ [ROL]: 'Coordinador', exp: enUnaHora }))).toBeTrue();
    expect(service.getRol()).toBe('Coordinador');
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('elige el rol que reconoce cuando el token trae varios', () => {
    const jwt = token({ [ROL]: ['1', 'Administrador (Tesorero)'], exp: enUnaHora });
    expect(service.iniciarSesionConToken(jwt)).toBeTrue();
    expect(service.getRoleId()).toBe(1);
  });

  it('reconoce los roles con tilde que trae el token (el payload es UTF-8)', () => {
    for (const [rol] of [['Médico'], ['Director Técnico'], ['Preparador Físico']] as const) {
      localStorage.clear();
      const crudo = new TextEncoder().encode(JSON.stringify({ [ROL]: rol, exp: enUnaHora }));
      const b64 = btoa(String.fromCharCode(...crudo)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(service.iniciarSesionConToken(`aaa.${b64}.firma`)).withContext(rol).toBeTrue();
      expect(service.getRol()).toBe(rol);
    }
  });

  it('rechaza un token vencido', () => {
    expect(service.iniciarSesionConToken(token({ [ROL]: 'Coordinador', exp: 1 }))).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('rechaza un token sin un rol de este portal (por ejemplo el Administrador del Administrativo)', () => {
    expect(service.iniciarSesionConToken(token({ [ROL]: '2', exp: enUnaHora }))).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('rechaza un texto que no es un token', () => {
    expect(service.iniciarSesionConToken('esto no es un token')).toBeFalse();
  });

  it('si el rol guardado falta, lo toma del token aunque traiga varios, y prefiere el nombre al id', () => {
    service.iniciarSesionConToken(token({ [ROL]: ['1', 'Administrador (Tesorero)'], exp: enUnaHora }));
    localStorage.removeItem('user_rol');
    expect(service.getRol()).toBe('Administrador (Tesorero)');
  });
});
