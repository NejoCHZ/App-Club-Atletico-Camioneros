import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SharedMedicalRecordComponent } from './shared-medical-record.component';

describe('SharedMedicalRecordComponent', () => {
  let http: HttpTestingController;
  function create(role: string) {
    TestBed.configureTestingModule({ imports: [SharedMedicalRecordComponent], providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '42' }) } } },
      { provide: AuthService, useValue: { getRol: () => role } },
    ] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SharedMedicalRecordComponent); fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }
  function flushProfile() {
    http.expectOne('/api/jugadores/42').flush({ idJugador: 42, nombre: 'Ana', apellido: 'Pérez', peso: 60, altura: 1.7, pieHabil: 'Derecho' });
    http.expectOne('/api/fichas-medicas/jugador/42').flush({ idFichaMedica: 7, idJugador: 42, grupoSanguineo: 'A+', antecedentesSalud: 'Asma', historialLesiones: 'Esguince', observaciones: 'Control' });
  }
  afterEach(() => { http.verify(); TestBed.resetTestingModule(); });
  it('opens read-only by default and exposes editing to Médico', () => {
    const { fixture, component } = create('Médico'); flushProfile(); fixture.detectChanges();
    expect(component.editMode).toBeFalse(); expect(component.canEdit).toBeTrue();
    expect(fixture.nativeElement.querySelector('.edit-button')?.textContent).toContain('Editar ficha médica');
    expect(fixture.nativeElement.querySelector('.actions')).toBeNull();
  });
  it('does not expose the edit button to coordinator', () => {
    const { fixture, component } = create('Coordinador'); flushProfile(); fixture.detectChanges();
    expect(component.canEdit).toBeFalse(); expect(fixture.nativeElement.querySelector('.edit-button')).toBeNull();
  });
  it('restores loaded values when edit is cancelled', () => {
    const { component } = create('Médico'); flushProfile(); component.startEditing();
    component.player!.peso = '99'; component.injuries = ['Cambio']; component.cancelEditing();
    expect(component.editMode).toBeFalse(); expect(component.player!.peso).toBe('60'); expect(component.injuries).toEqual(['Esguince']);
  });
  it('saves medical and physical fields transactionally then returns to read-only', () => {
    const { component } = create('Médico'); flushProfile(); component.startEditing();
    Object.assign(component.player!, { peso: '65,5 kg', altura: '1,78 m', pieHabil: 'Izquierdo', grupoSanguineo: 'O-', patologias: 'Alergia', observacionesMedicas: 'Apto' });
    component.injuries = ['Lesión nueva']; component.save();
    const request = http.expectOne('/api/jugadores/42/datos-medicos'); expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(jasmine.objectContaining({ peso: 65.5, altura: 1.78, pieHabil: 'Izquierdo', grupoSanguineo: 'O-', antecedentesSalud: 'Alergia', historialLesiones: 'Lesión nueva', observaciones: 'Apto' }));
    request.flush({}); expect(component.editMode).toBeFalse(); flushProfile();
  });
});
