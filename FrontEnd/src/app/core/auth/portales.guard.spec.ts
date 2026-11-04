import { TestBed } from '@angular/core/testing';
import { volverALosPortalesGuard } from './portales.guard';
import { navegador } from './navegador';
import { PORTALES } from './portales.config';

describe('volverALosPortalesGuard', () => {
  it('manda a la eleccion de portales del Portal Administrativo y no abre ninguna pantalla propia', () => {
    const irA = spyOn(navegador, 'irA');
    const resultado = TestBed.runInInjectionContext(() => volverALosPortalesGuard({} as never, {} as never));
    expect(resultado).toBeFalse();
    expect(irA).toHaveBeenCalledWith(`${PORTALES.administrativo}/portales`);
  });
});
