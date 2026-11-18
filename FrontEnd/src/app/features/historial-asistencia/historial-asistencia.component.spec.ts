import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { AsistenciaService } from '../../shared/services/asistencia.service';
import { JugadorService } from '../../shared/services/jugador.service';
import { HistorialAsistenciaComponent } from './historial-asistencia.component';

describe('HistorialAsistenciaComponent', () => {
  let fixture: ComponentFixture<HistorialAsistenciaComponent>;
  let component: HistorialAsistenciaComponent;
  let asistencia: jasmine.SpyObj<AsistenciaService>;

  beforeEach(async () => {
    asistencia = jasmine.createSpyObj<AsistenciaService>('AsistenciaService', ['obtenerHistorial', 'obtenerHistorialStaff']);
    asistencia.obtenerHistorial.and.returnValue(of([]));
    asistencia.obtenerHistorialStaff.and.returnValue(of([]));
    const jugador = jasmine.createSpyObj<JugadorService>('JugadorService', ['obtenerPorId']);
    jugador.obtenerPorId.and.returnValue(of({ id: 11, nombre: 'Ana', apellido: 'Pérez', dni: '40111222', fechaNacimiento: '2010-01-01', categoria: 'Sub 15', posicion: 'ARQUERO', clubOrigen: null, aptoFisico: true, tutor: null }));
    await TestBed.configureTestingModule({
      imports: [HistorialAsistenciaComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '11' }, data: {} } } },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        { provide: HttpClient, useValue: jasmine.createSpyObj<HttpClient>('HttpClient', ['get']) },
        { provide: AsistenciaService, useValue: asistencia },
        { provide: JugadorService, useValue: jugador },
        { provide: PortalAccessService, useValue: { role: 'admin' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HistorialAsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and renders the empty state', () => {
    expect(asistencia.obtenerHistorial).toHaveBeenCalledWith(11, { desde: undefined, hasta: undefined, estado: undefined });
    expect(fixture.nativeElement.textContent).toContain('No hay asistencias registradas');
  });

  it('applies and clears date and state filters', () => {
    component.desde = '2026-10-01'; component.hasta = '2026-10-20'; component.estado = 'PERMITIDO';
    component.buscar();
    expect(asistencia.obtenerHistorial).toHaveBeenCalledWith(11, { desde: '2026-10-01', hasta: '2026-10-20', estado: 'PERMITIDO' });
    component.limpiarFiltros();
    expect(component.desde).toBe(''); expect(component.hasta).toBe(''); expect(component.estado).toBe('');
  });

  it('rejects an inverted date range without querying', () => {
    asistencia.obtenerHistorial.calls.reset();
    component.desde = '2026-10-21'; component.hasta = '2026-10-20';
    component.buscar();
    expect(component.errorFiltros).toContain('no puede ser posterior');
    expect(asistencia.obtenerHistorial).not.toHaveBeenCalled();
  });

  it('renders the API error state', () => {
    asistencia.obtenerHistorial.and.returnValue(throwError(() => new Error('offline')));
    component.buscar(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el historial');
  });

  it('presents technical manual-DNI observations in user-friendly Spanish', () => {
    expect(component.presentarObservacion('Method=DNI_MANUAL; Detail=HTTP integration test')).toEqual({
      metodo: 'Registro manual por DNI',
      detalle: null,
    });
  });

  it('preserves real human observations', () => {
    expect(component.presentarObservacion('Llegó acompañado por su tutor.')).toEqual({
      metodo: null,
      detalle: 'Llegó acompañado por su tutor.',
    });
  });

  it('presents the persisted registration method and debt observation unchanged', () => {
    expect(component.presentarObservacion('Posee 2 meses de deuda - Lectura de credencial QR')).toEqual({
      metodo: null,
      detalle: 'Posee 2 meses de deuda - Lectura de credencial QR',
    });
  });
});

describe('HistorialAsistenciaComponent for staff', () => {
  it('loads staff summary and attendance using the same component', async () => {
    const asistencia = jasmine.createSpyObj<AsistenciaService>('AsistenciaService', ['obtenerHistorial', 'obtenerHistorialStaff']);
    asistencia.obtenerHistorialStaff.and.returnValue(of([{ idAsistencia: 8, idJugador: null, idStaff: 4, fechaHora: '2026-10-20T16:00:00', estadoAcceso: 'PERMITIDO', observaciones: null }]));
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    http.get.and.returnValue(of({ nombre: 'Ana', apellido: 'Gómez', dni: '30111222', categoriaAsignada: 'AFA 2008' }));
    await TestBed.configureTestingModule({
      imports: [HistorialAsistenciaComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '4' }, data: { entityType: 'staff' } } } },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        { provide: AsistenciaService, useValue: asistencia },
        { provide: JugadorService, useValue: jasmine.createSpyObj<JugadorService>('JugadorService', ['obtenerPorId']) },
        { provide: HttpClient, useValue: http },
        { provide: PortalAccessService, useValue: { role: 'admin' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistorialAsistenciaComponent);
    fixture.detectChanges();

    expect(http.get).toHaveBeenCalledWith('/api/staff/4');
    expect(asistencia.obtenerHistorialStaff).toHaveBeenCalledWith(4, { desde: undefined, hasta: undefined, estado: undefined });
    expect(fixture.nativeElement.textContent).toContain('Seguimiento del colaborador');
    expect(fixture.nativeElement.textContent).toContain('Ana Gómez');
    expect(fixture.nativeElement.textContent).toContain('PERMITIDO');
  });
});
