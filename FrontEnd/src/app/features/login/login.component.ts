import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { homeForRole, normalizeRole } from '../../core/auth/roles';
import { PORTALES } from '../../core/auth/portales.config';
import { navegador } from '../../core/auth/navegador';
import { tokenDelFragmento } from '../../core/auth/sso';

// Este portal NO tiene login. El inicio de sesion es unico y vive en el Portal Administrativo. Esta ruta solo recibe la
// sesion que ese portal entrega (#sso=<token>) y, si no hay una valida, manda de inmediato al login unico: no muestra nada.
@Component({
  selector: 'app-login',
  standalone: true,
  template: '<p class="entrando" role="status">Ingresando&hellip;</p>',
  styles: [':host{display:grid;place-items:center;min-height:100dvh;font-family:Inter,system-ui,sans-serif;color:#555}']
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (!this.esNavegador) return;

    const token = tokenDelFragmento(window.location.hash);
    // El token sale de la direccion enseguida: no queda en el historial ni se copia al compartir el enlace.
    if (token) window.history.replaceState(null, '', window.location.pathname + window.location.search);

    const role = token && this.authService.iniciarSesionConToken(token) ? normalizeRole(this.authService.getRol()) : null;
    if (!role) {
      this.authService.logout();
      navegador.irA(PORTALES.administrativo);
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : homeForRole(role));
  }
}
