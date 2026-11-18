import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { RolePlayerViewService } from '../../shared/services/role-player-view.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { DtCategoriaJugadoresComponent } from './dt-categoria-jugadores';

describe('DtCategoriaJugadoresComponent', () => {
  function configure(role: 'dt' | 'preparador-fisico') {
    TestBed.configureTestingModule({
      imports: [DtCategoriaJugadoresComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
        { provide: RolePlayerViewService, useValue: {
          categoryPlayers: () => of([{ id: 42, nombreCompleto: 'Jugador DT', dni: '123', posicion: 'ARQUERO', edad: '18 AÑOS', categoria: 'Sub 17', fechaNacimiento: '01/01/2008' }]),
          players: () => of([]),
        } },
        { provide: PortalAccessService, useValue: { role } },
      ],
    });
  }

  it('shows the canonical view and match-history actions with no mutation actions', () => {
    configure('dt');

    const fixture = TestBed.createComponent(DtCategoriaJugadoresComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Ver ficha');
    expect(element.textContent).toContain('Ver historial de partidos');
    expect(element.textContent).not.toContain('Editar');
    expect(element.textContent).not.toContain('Eliminar');
    expect(element.querySelector('aside.sidebar')).toBeNull();
    expect(element.querySelector('header.top-header')).toBeNull();
  });

  for (const role of ['dt', 'preparador-fisico'] as const) {
    it(`navigates ${role} to its shared category match history route`, () => {
      configure(role);
      const fixture = TestBed.createComponent(DtCategoriaJugadoresComponent);
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      fixture.detectChanges();

      fixture.componentInstance.verHistorialPartidos();

      expect(navigate).toHaveBeenCalledWith([`/${role}`, 'categorias', 7, 'partidos']);
    });
  }
});
