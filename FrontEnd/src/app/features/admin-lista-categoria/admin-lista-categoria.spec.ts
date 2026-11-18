import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { AdminListaCategoria, CategoriaItem } from './admin-lista-categoria';

describe('AdminListaCategoria medical navigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminListaCategoria],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { getToken: () => null, getRol: () => 'Médico', logout: () => undefined } },
        {
          provide: PortalAccessService,
          useValue: {
            role: 'medico',
            capabilities: { canManageCategories: false, canManageCategoryRoster: false },
            visibleCategories: (categories: unknown[]) => categories,
          },
        },
      ],
    }).compileComponents();
  });

  it('navigates to the medical category view without loading restricted admin endpoints', () => {
    const fixture = TestBed.createComponent(AdminListaCategoria);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpClient);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const get = spyOn(http, 'get').and.returnValue(of([]));
    const category: CategoriaItem = {
      id: 2,
      nombre: 'PT AFA 2008',
      cantidadJugadoresNum: 4,
      cantidadStaffNum: 2,
      cantidadJugadores: '4 JUGADORES',
      cantidadStaff: '2 CUERPO TÉCNICO',
      asociacion: 'AFA',
    };

    component.verCategoria(category);

    expect(navigate).toHaveBeenCalledOnceWith(['/medico', 'categorias', 2]);
    expect(get).not.toHaveBeenCalled();
    expect(component.modalPlantelVisible).toBeFalse();
    expect(component.categoryActionLabel).toBe('Ver plantel');
  });

  it('renders won, drawn and lost match results with their semantic color classes', () => {
    const fixture = TestBed.createComponent(AdminListaCategoria);
    fixture.componentInstance.modalPlantelVisible = true;
    fixture.componentInstance.categoriaActiva = {
      id: 2,
      nombre: 'PT AFA 2008',
      cantidadJugadoresNum: 0,
      cantidadStaffNum: 0,
      cantidadJugadores: '0 JUGADORES',
      cantidadStaff: '0 CUERPO TÉCNICO',
      asociacion: 'AFA',
    };
    fixture.componentInstance.tabActivaModal = 'partidos';
    fixture.componentInstance.partidosCategoria = [
      { idPartido: 1, fecha: '01/11/2026', rival: 'A', condicion: 'Local', resultado: 'G 2-0' },
      { idPartido: 2, fecha: '02/11/2026', rival: 'B', condicion: 'Local', resultado: 'E 1-1' },
      { idPartido: 3, fecha: '03/11/2026', rival: 'C', condicion: 'Visitante', resultado: 'P 0-1' },
    ];

    fixture.detectChanges();

    const results = Array.from(fixture.nativeElement.querySelectorAll('.text-resultado')) as HTMLElement[];
    expect(results[0].classList).toContain('resultado-ganado');
    expect(results[1].classList).toContain('resultado-empatado');
    expect(results[2].classList).toContain('resultado-perdido');
  });

  it('does not submit a match again while the previous request is pending', () => {
    const fixture = TestBed.createComponent(AdminListaCategoria);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpClient);
    const post = spyOn(http, 'post');
    component.categoriaActiva = {
      id: 2,
      nombre: 'PT AFA 2008',
      cantidadJugadoresNum: 0,
      cantidadStaffNum: 0,
      cantidadJugadores: '0 JUGADORES',
      cantidadStaff: '0 CUERPO TÉCNICO',
      asociacion: 'AFA',
    };
    component.partidoForm.fechaPartido = '2026-11-17';
    component.partidoForm.rival = 'Rival';
    component.marcadorResultado = '1-0';
    component.guardandoPartido = true;

    component.guardarPartido();

    expect(post).not.toHaveBeenCalled();
  });

  it('does not submit minutes outside the allowed range', () => {
    const fixture = TestBed.createComponent(AdminListaCategoria);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpClient);
    const post = spyOn(http, 'post');
    spyOn(window, 'alert');
    component.categoriaActiva = {
      id: 2,
      nombre: 'PT AFA 2008',
      cantidadJugadoresNum: 1,
      cantidadStaffNum: 0,
      cantidadJugadores: '1 JUGADORES',
      cantidadStaff: '0 CUERPO TÉCNICO',
      asociacion: 'AFA',
    };
    component.partidoForm.fechaPartido = '2026-11-17';
    component.partidoForm.rival = 'Rival';
    component.marcadorResultado = '1-0';
    component.jugadoresPlantel = [{
      idJugador: 1,
      nombreCompleto: 'Jugador',
      dni: '1',
      posicionCancha: 'Arquero',
      minutosJugados: 121,
    }];

    component.guardarPartido();

    expect(post).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringContaining('entre 0 y 120'));
  });

  it('normalizes the category name and blocks a second submit while the first is pending', () => {
    const fixture = TestBed.createComponent(AdminListaCategoria);
    const component = fixture.componentInstance;
    (component as any).canManageCategories = true;
    const http = TestBed.inject(HttpClient);
    const post = spyOn(http, 'post').and.returnValue(NEVER);
    component.categoriaFormNombre = '  Pt   AFA  2008  ';
    component.categoriaFormAsociacion = 'AFA';

    component.guardarCategoria();
    component.guardarCategoria();

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/api/categorias', {
      nombreCategoria: 'Pt AFA 2008',
      asociacion: 'AFA',
    });
    expect(component.guardandoCategoria).toBeTrue();
  });
});
