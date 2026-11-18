import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminEditarPerfil } from './admin-editar-perfil';

describe('AdminEditarPerfil atomic save', () => {
  let http: HttpTestingController;
  let component: AdminEditarPerfil;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminEditarPerfil],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '25' } } }
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') }
        }
      ]
    });

    component = TestBed.createComponent(AdminEditarPerfil).componentInstance;
    http = TestBed.inject(HttpTestingController);
    component.jugadorId = '25';
    component.perfil = {
      dni: '47265479',
      nombre: 'Jugador',
      apellido: 'Existente',
      posicion: 'DEFENSOR',
      altura: 1.78,
      peso: 72.5,
      pieHabil: 'Derecho',
      tutor: { dni: '' },
      fichaMedica: {
        grupoSanguineo: 'O+',
        patologias: 'Asma',
        historialLesiones: 'Esguince',
        observaciones: 'Control'
      }
    };
  });

  afterEach(() => http.verify());

  it('persists profile and medical record with a single request', () => {
    component.guardar();

    const request = http.expectOne('/api/jugadores/25');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.fichaMedica).toEqual({
      grupoSanguineo: 'O+',
      patologias: 'Asma',
      historialLesiones: 'Esguince',
      observaciones: 'Control'
    });
    http.expectNone('/api/fichas-medicas/1');

    request.flush({});
  });
});
