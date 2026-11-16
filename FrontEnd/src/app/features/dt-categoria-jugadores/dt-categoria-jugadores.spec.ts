import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RolePlayerViewService } from '../../shared/services/role-player-view.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { DtCategoriaJugadoresComponent } from './dt-categoria-jugadores';

describe('DtCategoriaJugadoresComponent', () => {
  it('shows the canonical view action and no mutation actions', () => {
    TestBed.configureTestingModule({
      imports: [DtCategoriaJugadoresComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
        { provide: RolePlayerViewService, useValue: {
          categoryPlayers: () => of([{ id: 42, nombreCompleto: 'Jugador DT', dni: '123', posicion: 'ARQUERO', edad: '18 AÑOS', categoria: 'Sub 17', fechaNacimiento: '01/01/2008' }]),
          players: () => of([]),
        } },
        { provide: PortalAccessService, useValue: { role: 'dt' } },
      ],
    });

    const fixture = TestBed.createComponent(DtCategoriaJugadoresComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Ver ficha');
    expect(element.textContent).not.toContain('Editar');
    expect(element.textContent).not.toContain('Eliminar');
    expect(element.querySelector('aside.sidebar')).toBeNull();
    expect(element.querySelector('header.top-header')).toBeNull();
  });
});
