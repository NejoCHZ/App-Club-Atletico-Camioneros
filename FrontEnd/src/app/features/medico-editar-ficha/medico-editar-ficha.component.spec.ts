import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicoEditarFichaComponent } from './medico-editar-ficha.component';
import { RolePlayerViewService } from '../../shared/services/role-player-view.service';

describe('MedicoEditarFichaComponent', () => {
  function createComponent(): MedicoEditarFichaComponent {
    return new MedicoEditarFichaComponent(
      { params: of({}) } as unknown as ActivatedRoute,
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      jasmine.createSpyObj<RolePlayerViewService>('RolePlayerViewService', ['profile', 'saveMedical']),
    );
  }

  it('adds a descriptive injury with the current date', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 16, 12));
    const component = createComponent();
    component.player.lesiones = [];
    component.nuevaLesion = 'Esguince de tobillo';

    component.agregarLesion();

    expect(component.player.lesiones).toEqual(['Esguince de tobillo (16/11/2026)']);
    expect(component.nuevaLesion).toBe('');
    jasmine.clock().uninstall();
  });

  it('does not add an empty injury', () => {
    const component = createComponent();
    component.player.lesiones = [];
    component.nuevaLesion = '   ';

    component.agregarLesion();

    expect(component.player.lesiones).toEqual([]);
  });
});
