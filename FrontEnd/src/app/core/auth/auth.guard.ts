import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { AppRole, normalizeRole } from './roles';

function authorize(url: string, allowedRoles?: readonly AppRole[]) {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: url } });
  }

  const role = normalizeRole(auth.getRol());
  if (!role) {
    auth.logout();
    return router.createUrlTree(['/login']);
  }

  // Administrators own every application capability. Route metadata describes
  // the minimum portal role, while admin remains the explicit super-role.
  if (role !== 'admin' && allowedRoles && !allowedRoles.includes(role)) {
    return router.createUrlTree(['/acceso-denegado']);
  }

  return true;
}

export const authGuard: CanActivateFn = (_route, state) => authorize(state.url);

export const roleGuard: CanActivateFn = (route, state) =>
  authorize(state.url, route.data?.['roles'] as readonly AppRole[] | undefined);

export const roleChildGuard: CanActivateChildFn = (childRoute, state) =>
  authorize(state.url, childRoute.data?.['roles'] as readonly AppRole[] | undefined);

export const roleMatchGuard: CanMatchFn = (route, segments) => {
  const router = inject(Router);
  const attemptedUrl = router.getCurrentNavigation()?.extractedUrl.toString()
    ?? `/${segments.map((segment) => segment.path).join('/')}`;

  return authorize(attemptedUrl, route.data?.['roles'] as readonly AppRole[] | undefined);
};
