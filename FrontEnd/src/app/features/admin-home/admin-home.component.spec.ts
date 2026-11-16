import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { AdminHomeComponent } from './admin-home.component';

class AuthServiceStub {
  role = 'Administrador (Tesorero)';

  getRol(): string { return this.role; }
  getToken(): string | null { return null; }
}

describe('AdminHomeComponent navigation', () => {
  let auth: AuthServiceStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    router = TestBed.inject(Router);
  });

  it('keeps administrator navigation inside the admin portal', () => {
    const component = TestBed.createComponent(AdminHomeComponent).componentInstance;
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    component.selectNav('Jugadores');

    expect(navigate).toHaveBeenCalledOnceWith(['/admin/jugadores']);
  });

  it('keeps director navigation inside the DT portal', () => {
    auth.role = 'Director Técnico';
    const component = TestBed.createComponent(AdminHomeComponent).componentInstance;
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    component.selectNav('Jugadores');
    component.selectNav('Categorias');

    expect(navigate.calls.argsFor(0)).toEqual([['/dt/jugadores']]);
    expect(navigate.calls.argsFor(1)).toEqual([['/dt/categorias']]);
  });

  it('keeps medical navigation inside the medical portal', () => {
    auth.role = 'Médico';
    const component = TestBed.createComponent(AdminHomeComponent).componentInstance;
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    component.selectNav('Jugadores');
    component.selectNav('Categorias');

    expect(navigate.calls.argsFor(0)).toEqual([['/medico/jugadores']]);
    expect(navigate.calls.argsFor(1)).toEqual([['/medico/categorias']]);
  });

  it('does not expose financial status to the medical role', () => {
    auth.role = 'Médico';
    const fixture = TestBed.createComponent(AdminHomeComponent);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect(fixture.componentInstance.showFinancialStatus).toBeFalse();
    expect(fixture.componentInstance.kpiCards.some(card => card.type === 'cuotas')).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Estado Cuota');
    expect(fixture.nativeElement.textContent).not.toContain('Cuotas al Día');
  });

  it('keeps coordinator navigation inside the coordinator portal', () => {
    auth.role = 'Coordinador';
    const component = TestBed.createComponent(AdminHomeComponent).componentInstance;
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    component.selectNav('Jugadores');
    component.selectNav('Staff');

    expect(navigate.calls.argsFor(0)).toEqual([['/coordinador/jugadores']]);
    expect(navigate.calls.argsFor(1)).toEqual([['/coordinador/staff']]);
  });
});
