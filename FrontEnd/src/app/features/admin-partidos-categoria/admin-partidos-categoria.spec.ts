import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { HttpClient } from '@angular/common/http';
import { AdminPartidosCategoria } from './admin-partidos-categoria';

describe('AdminPartidosCategoria', () => {
  function configure(role: 'admin' | 'dt' | 'preparador-fisico') {
    TestBed.configureTestingModule({
      imports: [AdminPartidosCategoria],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: AuthService, useValue: { getToken: () => null, getRol: () => role, logout: () => undefined } },
        { provide: PortalAccessService, useValue: { role } },
      ],
    });
  }

  for (const role of ['admin', 'dt'] as const) {
    it(`shows create, edit and delete controls for ${role}`, () => {
      configure(role);
      const fixture = TestBed.createComponent(AdminPartidosCategoria);
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      fixture.componentInstance.partidos = [{ idPartido: 1, idCategoria: 7, categoria: 'Sub 17', fecha: '01/01/2026', fechaIso: '2026-01-01', rival: 'Rival', condicion: 'Local', resultado: 'G 1-0' }];
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Cargar Nuevo Partido');
      expect(element.querySelector('.view-btn')).not.toBeNull();
      expect(element.querySelector('.edit-btn')).not.toBeNull();
      expect(element.querySelector('.delete-btn')).not.toBeNull();
      if (role === 'dt') {
        expect(fixture.componentInstance.navItems.some(item => item.label === 'Staff')).toBeFalse();
      }

      fixture.componentInstance.volver();
      expect(navigate).toHaveBeenCalledWith([`/${role}/categorias`]);
    });
  }

  it('keeps the physical trainer read-only', () => {
    configure('preparador-fisico');
    const fixture = TestBed.createComponent(AdminPartidosCategoria);
    fixture.componentInstance.partidos = [{ idPartido: 1, idCategoria: 7, categoria: 'Sub 17', fecha: '01/01/2026', fechaIso: '2026-01-01', rival: 'Rival', condicion: 'Local', resultado: 'G 1-0' }];
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain('Cargar Nuevo Partido');
    expect(element.querySelector('.view-btn')).not.toBeNull();
    expect(element.querySelector('.edit-btn')).toBeNull();
    expect(element.querySelector('.delete-btn')).toBeNull();
    expect(fixture.componentInstance.navItems.some(item => item.label === 'Staff')).toBeFalse();
  });

  it('does not submit a match again while the previous request is pending', () => {
    configure('admin');
    const fixture = TestBed.createComponent(AdminPartidosCategoria);
    const http = TestBed.inject(HttpClient);
    const post = spyOn(http, 'post');
    Object.assign(fixture.componentInstance, {
      categoriaId: 7,
      fechaPartido: '2026-11-17',
      rival: 'Rival',
      marcador: '1-0',
      guardando: true,
    });

    fixture.componentInstance.guardarPartido();

    expect(post).not.toHaveBeenCalled();
  });

  it('does not submit invalid or duplicate player participations', () => {
    configure('admin');
    const fixture = TestBed.createComponent(AdminPartidosCategoria);
    const http = TestBed.inject(HttpClient);
    const post = spyOn(http, 'post');
    spyOn(window, 'alert');
    Object.assign(fixture.componentInstance, {
      categoriaId: 7,
      fechaPartido: '2026-11-17',
      rival: 'Rival',
      marcador: '1-0',
      jugadoresMinutos: [
        { idJugador: 1, nombreCompleto: 'A', dni: '1', minutosJugados: 90 },
        { idJugador: 1, nombreCompleto: 'A', dni: '1', minutosJugados: 45 },
      ],
    });

    fixture.componentInstance.guardarPartido();

    expect(post).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringContaining('más de una vez'));
  });
});
