import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  afterEach(() => localStorage.clear());

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

  it('clears a corrupt token instead of treating it as an authenticated session', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const service = TestBed.inject(AuthService);
    localStorage.setItem('jwt_token', 'not-a-jwt');
    localStorage.setItem('user_rol', 'Administrador');

    expect(service.estaAutenticado()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(service.getRol()).toBeNull();
  });
});
