import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminAltaJugadorComponent } from './admin-alta-jugador.component';

const API_JUGADORES = '/api/jugadores';

describe('AdminAltaJugadorComponent: validación del alta', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  });

  function crear() {
    const fixture = TestBed.createComponent(AdminAltaJugadorComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.match('/api/categorias');
    return { fixture, componente: fixture.componentInstance, http };
  }

  function completar(c: AdminAltaJugadorComponent) {
    c.dni = '41000001';
    c.nombre = 'Juan';
    c.apellido = 'Perez';
    c.fechaNacimiento = '05/05/2010';
    c.genero = 'Masculino';
    c.categoria = 3;
    c.posicion = 'Delantero';
    c.esMenorDeEdad = false;
  }

  it('un alta incompleta dice qué campos faltan, sin cuadro del navegador y sin llamar a la API', () => {
    const alerta = spyOn(window, 'alert');
    const { componente, http } = crear();
    componente.dni = '41000001';

    componente.guardarYGenerarQR();

    expect(alerta).not.toHaveBeenCalled();
    for (const campo of ['Nombre', 'Apellido', 'Fecha de nacimiento', 'Género', 'Categoría', 'Posición']) {
      expect(componente.errorGuardado).toContain(campo);
    }
    expect(componente.errorGuardado).not.toContain('DNI');
    http.expectNone(API_JUGADORES);
  });

  it('marca en línea cada campo faltante', () => {
    spyOn(window, 'alert');
    const { fixture, componente } = crear();

    componente.guardarYGenerarQR();
    fixture.detectChanges();

    const avisos = Array.from(fixture.nativeElement.querySelectorAll('.field-error') as NodeListOf<HTMLElement>).map((e) => e.textContent ?? '');
    for (const texto of ['Ingresá el DNI', 'Ingresá el nombre', 'Ingresá el apellido', 'Ingresá la fecha de nacimiento', 'Seleccioná el género', 'Seleccioná una categoría', 'Seleccioná una posición']) {
      expect(avisos.some((a) => a.includes(texto))).withContext(texto).toBeTrue();
    }
  });

  it('un menor sin datos del tutor dice cuáles faltan, sin cuadro del navegador', () => {
    const alerta = spyOn(window, 'alert');
    const { componente, http } = crear();
    completar(componente);
    componente.esMenorDeEdad = true;

    componente.guardarYGenerarQR();

    expect(alerta).not.toHaveBeenCalled();
    expect(componente.errorGuardado).toContain('tutor');
    expect(componente.errorGuardado).toContain('teléfono');
    http.expectNone(API_JUGADORES);
  });

  it('si el Portal Administrativo no generó los cargos, el alta queda hecha y se avisa', () => {
    spyOn(window, 'alert');
    const { componente, http } = crear();
    completar(componente);

    componente.guardarYGenerarQR();
    http.expectOne(API_JUGADORES).flush({ dni: '41000001', nombre: 'Juan', apellido: 'Perez', cargosGenerados: false, avisoCargos: 'Aviso de cargos pendientes.' });

    expect(componente.mensajeExito).toBeTrue();
    expect(componente.avisoCargos).toBe('Aviso de cargos pendientes.');
  });

  it('si los cargos se generaron, no hay aviso', () => {
    spyOn(window, 'alert');
    const { componente, http } = crear();
    completar(componente);

    componente.guardarYGenerarQR();
    http.expectOne(API_JUGADORES).flush({ dni: '41000001', nombre: 'Juan', apellido: 'Perez', cargosGenerados: true, avisoCargos: null });

    expect(componente.mensajeExito).toBeTrue();
    expect(componente.avisoCargos).toBe('');
  });
});
