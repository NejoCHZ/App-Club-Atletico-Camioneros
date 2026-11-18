import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { JugadorService } from '../../shared/services/jugador.service';
import { AdminAltaJugadorComponent } from './admin-alta-jugador.component';

describe('AdminAltaJugadorComponent submission', () => {
  let crear: jasmine.Spy;
  let router: Router;

  beforeEach(async () => {
    crear = jasmine.createSpy('crear').and.returnValue(of({
      idJugador: 77,
      id: 77,
      dni: '99000001',
      nombre: 'Jugador',
      apellido: 'Nuevo',
    }));

    await TestBed.configureTestingModule({
      imports: [AdminAltaJugadorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: JugadorService, useValue: { crear } },
        { provide: AuthService, useValue: { getToken: () => null, getRol: () => 'Administrador', logout: () => undefined } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('does not submit the player again after a successful creation', () => {
    const component = TestBed.createComponent(AdminAltaJugadorComponent).componentInstance;
    component.dni = '99000001';
    component.nombre = 'Jugador';
    component.apellido = 'Nuevo';
    component.fechaNacimiento = '01/01/2000';
    component.categoria = 1;
    component.posicion = 'Defensor';
    component.esMenorDeEdad = false;

    component.guardarYGenerarQR();
    component.guardarYGenerarQR();

    expect(crear).toHaveBeenCalledTimes(1);
    expect(component.nuevoJugadorId).toBe(77);
  });

  it('does not submit again even when a successful response omits the player id', () => {
    crear.and.returnValue(of({ dni: '99000001', nombre: 'Jugador', apellido: 'Nuevo' }));
    const component = TestBed.createComponent(AdminAltaJugadorComponent).componentInstance;
    component.dni = '99000001';
    component.nombre = 'Jugador';
    component.apellido = 'Nuevo';
    component.fechaNacimiento = '01/01/2000';
    component.categoria = 1;
    component.posicion = 'Defensor';
    component.esMenorDeEdad = false;

    component.guardarYGenerarQR();
    component.guardarYGenerarQR();

    expect(crear).toHaveBeenCalledTimes(1);
    expect(component.mensajeExito).toBeTrue();
  });

  it('navigates to the created player when the credential popup is closed', () => {
    const component = TestBed.createComponent(AdminAltaJugadorComponent).componentInstance;
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    component.nuevoJugadorId = 77;
    component.mostrarPopupCredencial = true;

    component.cerrarCredencial();

    expect(component.mostrarPopupCredencial).toBeFalse();
    expect(navigate).toHaveBeenCalledOnceWith(['/admin/jugadores', 77]);
  });

  it('does not submit when the player is entered as their own tutor', () => {
    const component = TestBed.createComponent(AdminAltaJugadorComponent).componentInstance;
    component.dni = '47.265.479';
    component.nombre = 'Jugador';
    component.apellido = 'Nuevo';
    component.fechaNacimiento = '01/01/2015';
    component.categoria = 1;
    component.posicion = 'Defensor';
    component.esMenorDeEdad = true;
    component.tutorDni = '47265479';
    component.tutorNombre = 'Tutor';
    component.tutorApellido = 'Inválido';
    component.tutorTelefono = '3510000000';
    component.tutorParentesco = 'Padre';

    component.guardarYGenerarQR();

    expect(crear).not.toHaveBeenCalled();
    expect(component.errorGuardado).toContain('propio tutor');
  });
});
