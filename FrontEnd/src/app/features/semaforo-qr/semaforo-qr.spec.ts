import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { SemaforoQrComponent } from './semaforo-qr';
import { AsistenciaService } from '../../shared/services/asistencia.service';
import { AuthService } from '../../shared/services/auth.service';
import { provideRouter, Router } from '@angular/router';

describe('SemaforoQrComponent', () => {
  let fixture: ComponentFixture<SemaforoQrComponent>;
  const registrar = jasmine.createSpy('registrar');
  const logout = jasmine.createSpy('logout');
  let role: string;

  beforeEach(async () => {
    registrar.calls.reset();
    logout.calls.reset();
    role = 'Don QR';
    await TestBed.configureTestingModule({
      imports: [SemaforoQrComponent],
      providers: [
        provideRouter([]),
        { provide: AsistenciaService, useValue: { registrar } },
        { provide: AuthService, useValue: { logout, getRol: () => role } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SemaforoQrComponent);
  });

  it('shows the explicit already-taken state after manual entry', fakeAsync(() => {
    registrar.and.returnValue(of({ accesoPermitido: true, estadoAcceso: 'PERMITIDO', estadoRegistro: 'YA_REGISTRADA', asistenciaRegistrada: true, yaRegistrada: true, mensaje: 'Asistencia ya tomada.', deudaTotal: 0, cuotasVencidas: 0 }));
    fixture.componentInstance.dni = '40111222';
    fixture.componentInstance.submitManual();
    expect(registrar).toHaveBeenCalledWith('40111222', 'DNI_MANUAL');
    fixture.detectChanges();
    tick();
    const result = fixture.nativeElement.querySelector('[role="status"].result-card') as HTMLElement;
    const heading = result.querySelector('h1') as HTMLElement;
    expect(result.getAttribute('aria-live')).toBe('assertive');
    expect(result.classList).toContain('green');
    expect(result.querySelector('.warning-icon')).not.toBeNull();
    expect(result.querySelector('.status-icon')?.textContent).not.toContain('✓');
    expect(heading.textContent).toContain('Asistencia ya tomada');
    expect(document.activeElement).toBe(heading);
  }));

  it('shows the same already-taken state after a QR scan', () => {
    registrar.and.returnValue(of({ accesoPermitido: false, estadoAcceso: 'DENEGADO', estadoRegistro: 'YA_REGISTRADA', asistenciaRegistrada: true, yaRegistrada: true, mensaje: 'Asistencia ya tomada.', deudaTotal: 2000, cuotasVencidas: 2 }));

    (fixture.componentInstance as any).processPayload('signed-credential', 'QR');
    fixture.detectChanges();

    expect(registrar).toHaveBeenCalledWith('signed-credential', 'QR');
    const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
    expect(result.classList).toContain('green');
    expect(result.classList).not.toContain('red');
    expect(result.querySelector('.warning-icon')).not.toBeNull();
    expect(result.textContent).toContain('Asistencia ya tomada');
  });

  it('does not show green or yellow without backend attendance confirmation', () => {
    registrar.and.returnValue(of({ accesoPermitido: true, estadoAcceso: 'PERMITIDO', estadoRegistro: 'REGISTRADA', asistenciaRegistrada: false, yaRegistrada: false, mensaje: 'No confirmada', deudaTotal: 0, cuotasVencidas: 0 }));
    fixture.componentInstance.dni = '40111222';
    fixture.componentInstance.submitManual();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('no confirmó');
  });

  it('shows a recorded denied attempt as the red semaphore result', () => {
    registrar.and.returnValue(of({ accesoPermitido: false, estadoAcceso: 'DENEGADO', estadoRegistro: 'REGISTRADA', asistenciaRegistrada: true, yaRegistrada: false, mensaje: 'Acceso denegado. El intento de ingreso fue registrado.', deudaTotal: 2000, cuotasVencidas: 2 }));
    fixture.componentInstance.dni = '99000002';
    fixture.componentInstance.submitManual();
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
    expect(result.classList).toContain('red');
    expect(result.textContent).toContain('Jugador inhabilitado');
    expect(result.textContent).toContain('intento de ingreso fue registrado');
  });

  it('marks camera payloads as QR credential reads', () => {
    registrar.and.returnValue(of({ accesoPermitido: true, estadoAcceso: 'PERMITIDO', estadoRegistro: 'REGISTRADA', asistenciaRegistrada: true, yaRegistrada: false, mensaje: 'Registrada', deudaTotal: 0, cuotasVencidas: 0 }));
    (fixture.componentInstance as any).processPayload('99000001', 'QR');
    expect(registrar).toHaveBeenCalledWith('99000001', 'QR');
  });

  it('returns a DT to its portal without logging out', () => {
    role = 'Director Técnico';
    fixture = TestBed.createComponent(SemaforoQrComponent);
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.qr-header button') as HTMLButtonElement;
    expect(button.textContent).toContain('Volver al inicio');
    button.click();

    expect(navigate).toHaveBeenCalledOnceWith(['/dt']);
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps the standalone Don QR logout action', () => {
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.qr-header button') as HTMLButtonElement;
    expect(button.textContent).toContain('Cerrar sesión');
    expect(fixture.componentInstance.isDtPortal).toBeFalse();
  });
});
