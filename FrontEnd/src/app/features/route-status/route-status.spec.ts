import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { RouteStatusComponent } from './route-status';

class AuthServiceStub {
  authenticated = true;
  role = 'Preparador Físico';

  estaAutenticado(): boolean { return this.authenticated; }
  getRol(): string | null { return this.role; }
}

describe('RouteStatusComponent', () => {
  let auth: AuthServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteStatusComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  it('returns an authenticated Preparador Físico to its portal home', () => {
    const fixture = TestBed.createComponent(RouteStatusComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.homePath).toBe('/preparador-fisico');
  });

  it('returns an unauthenticated visitor to login', () => {
    auth.authenticated = false;
    const fixture = TestBed.createComponent(RouteStatusComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.homePath).toBe('/login');
  });
});
