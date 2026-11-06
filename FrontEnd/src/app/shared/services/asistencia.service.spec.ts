import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AsistenciaService } from './asistencia.service';

describe('AsistenciaService', () => {
  let service: AsistenciaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AsistenciaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the same-origin atomic attendance endpoint with the scanned DNI', () => {
    service.registrar('40111222', 'DNI_MANUAL').subscribe(r => expect(r.estado).toBe('solo_entrenamientos'));
    const req = http.expectOne('/api/asistencias/verificar-y-registrar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ dni: '40111222', metodoRegistro: 'DNI_MANUAL' });
    req.flush({ accesoPermitido: true, asistenciaRegistrada: true, yaRegistrada: false, mensaje: 'ok', estado: 'solo_entrenamientos', verificado: true });
  });

  it('gets a player attendance history with optional filters', () => {
    service.obtenerHistorial(11, { desde: '2026-10-01', hasta: '2026-10-20', estado: 'PERMITIDO' }).subscribe();
    const req = http.expectOne(request => request.url === '/api/asistencias/jugador/11');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('desde')).toBe('2026-10-01');
    expect(req.request.params.get('hasta')).toBe('2026-10-20');
    expect(req.request.params.get('estado')).toBe('PERMITIDO');
    req.flush([]);
  });

  it('omits empty history filters', () => {
    service.obtenerHistorial(11).subscribe();
    const req = http.expectOne('/api/asistencias/jugador/11');
    expect(req.request.params.keys()).toEqual([]);
    req.flush([]);
  });
});
describe('AsistenciaService - metodo por defecto', () => {
  it('sin metodo informado registra como DNI manual', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const service = TestBed.inject(AsistenciaService);
    const http = TestBed.inject(HttpTestingController);

    service.registrar('40111222').subscribe();

    const req = http.expectOne('/api/asistencias/verificar-y-registrar');
    expect(req.request.body).toEqual({ dni: '40111222', metodoRegistro: 'DNI_MANUAL' });
    req.flush({ accesoPermitido: true, asistenciaRegistrada: true, yaRegistrada: false, mensaje: 'ok' });
    http.verify();
  });
});
