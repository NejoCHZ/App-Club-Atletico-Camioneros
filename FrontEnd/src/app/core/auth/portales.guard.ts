import { CanActivateFn } from '@angular/router';
import { PORTALES } from './portales.config';
import { navegador } from './navegador';

// Hay una sola eleccion de portales: la del Portal Administrativo. Todo "volver a portales" de este portal va para alla.
export const volverALosPortalesGuard: CanActivateFn = () => {
  navegador.irA(`${PORTALES.administrativo}/portales`);
  return false;
};
