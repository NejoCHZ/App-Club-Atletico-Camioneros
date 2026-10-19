import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { SemaforoQrComponent } from './semaforo-qr';
import { AsistenciaService } from '../../shared/services/asistencia.service';
import { AuthService } from '../../shared/services/auth.service';

describe('SemaforoQrComponent', () => {
  let fixture: ComponentFixture<SemaforoQrComponent>;
  const registrar = jasmine.createSpy('registrar');

  beforeEach(async () => {
    registrar.calls.reset();
    await TestBed.configureTestingModule({
      imports: [SemaforoQrComponent],
      providers: [
        { provide: AsistenciaService, useValue: { registrar } },
        { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SemaforoQrComponent);
  });

  it('announces and focuses an idempotently registered result', fakeAsync(() => {
    registrar.and.returnValue(of({ accesoPermitido: true, asistenciaRegistrada: true, yaRegistrada: true, mensaje: 'Ya registrada' }));
    fixture.componentInstance.dni = '40111222';
    fixture.componentInstance.submitManual();
    fixture.detectChanges();
    tick();
    const result = fixture.nativeElement.querySelector('[role="status"].result-card') as HTMLElement;
    const heading = result.querySelector('h1') as HTMLElement;
    expect(result.getAttribute('aria-live')).toBe('assertive');
    expect(result.classList).toContain('green');
    expect(document.activeElement).toBe(heading);
  }));

  function mostrar(resultado: object): HTMLElement {
    registrar.and.returnValue(of(resultado));
    fixture.componentInstance.dni = '40111222';
    fixture.componentInstance.submitManual();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.result-card') as HTMLElement;
  }

  it('shows yellow with a month of debt', () => {
    const card = mostrar({ accesoPermitido: true, asistenciaRegistrada: true, yaRegistrada: false, mensaje: 'Un mes', verificado: true, estado: 'solo_entrenamientos' });
    expect(card.classList).toContain('yellow');
    expect(card.querySelector('h1')!.textContent).toContain('con deuda');
  });

  it('shows red without access', () => {
    const card = mostrar({ accesoPermitido: false, asistenciaRegistrada: false, yaRegistrada: false, mensaje: 'Denegado', verificado: true, estado: 'inhabilitado' });
    expect(card.classList).toContain('red');
    expect(card.querySelector('h1')!.textContent).toContain('inhabilitado');
  });

  it('shows red and says so when the player was removed from the club', () => {
    const card = mostrar({ accesoPermitido: false, asistenciaRegistrada: false, yaRegistrada: false, mensaje: 'Baja', verificado: true, estado: 'baja' });
    expect(card.classList).toContain('red');
    expect(card.querySelector('h1')!.textContent).toContain('dado de baja');
  });

  it('shows yellow, never green, when the debt could not be verified', () => {
    const card = mostrar({ accesoPermitido: true, asistenciaRegistrada: true, yaRegistrada: false, mensaje: 'Sin verificar', verificado: false, estado: 'sin_verificar' });
    expect(card.classList).toContain('yellow');
    expect(card.classList).not.toContain('green');
    expect(card.querySelector('h1')!.textContent).toContain('sin verificar');
  });

  it('does not show green or yellow without backend attendance confirmation', () => {
    registrar.and.returnValue(of({ accesoPermitido: true, asistenciaRegistrada: false, yaRegistrada: false, mensaje: 'No confirmada' }));
    fixture.componentInstance.dni = '40111222';
    fixture.componentInstance.submitManual();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('no confirmó');
  });
});
