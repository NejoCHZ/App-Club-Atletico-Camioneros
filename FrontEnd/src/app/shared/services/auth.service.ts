import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Capability, RoleId, hasCapability, normalizeRole } from '../../core/auth/roles';
import { PORTALES } from '../../core/auth/portales.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  login(credenciales: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(response => {
        if (response && response.token) {
          this.storage?.setItem('jwt_token', response.token);

          // 1. Intentar leer rol desde el body
          let rolDetectado = response.rol || response.role || response.Rol;

          // 2. Si no vino en el body, extraerlo del payload del JWT
          if (!rolDetectado) {
            try {
              const payload = this.decodeTokenPayload(response.token);
              rolDetectado = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                || payload['role']
                || payload['rol'];
            } catch { /* The guard rejects tokens without a readable role. */ }
          }

          if (rolDetectado) {
            this.storage?.setItem('user_rol', rolDetectado);
          } else {
            this.storage?.removeItem('user_rol');
          }
        }
      })
    );
  }

  // Inicia la sesión con el token que emitió el Portal Administrativo (el login es único). Devuelve false si el token
  // venció o no trae un rol de este portal.
  iniciarSesionConToken(token: string): boolean {
    try {
      const payload = this.decodeTokenPayload(token);
      if (typeof payload['exp'] === 'number' && payload['exp'] * 1000 <= Date.now()) return false;
      const rol = this.elegirRol(payload);
      if (!rol) return false;
      this.storage?.setItem('jwt_token', token);
      this.storage?.setItem('user_rol', rol);
      return true;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return this.storage?.getItem('jwt_token') ?? null;
  }

  getRol(): string | null {
    const rolLocal = this.storage?.getItem('user_rol');
    if (rolLocal && rolLocal !== 'undefined' && rolLocal !== 'null') {
      // Una sesion guardada con el id del rol ("1") se corrige con el nombre que trae el mismo token.
      if (/^\d+$/.test(rolLocal.trim())) {
        const token = this.getToken();
        if (token) {
          try {
            const rolDelToken = this.elegirRol(this.decodeTokenPayload(token));
            if (rolDelToken) return rolDelToken;
          } catch { /* se usa el valor guardado */ }
        }
      }
      return rolLocal;
    }

    // Respaldo: leer directo del token si user_rol estuviera vacío
    const token = this.getToken();
    if (token) {
      try {
        return this.elegirRol(this.decodeTokenPayload(token));
      } catch {
        return null;
      }
    }
    return null;
  }

  getRoleId(): RoleId | null {
    const role = normalizeRole(this.getRol());
    const roleIds: Record<string, RoleId> = {
      admin: RoleId.Administrador,
      coordinador: RoleId.Coordinador,
      medico: RoleId.Medico,
      dt: RoleId.DirectorTecnico,
      'don-qr': RoleId.DonQr
    };
    return role ? roleIds[role] : null;
  }

  puede(capability: Capability): boolean {
    return hasCapability(this.getRoleId(), capability);
  }

  logout(): void {
    this.cerrarSesionEnElAdministrativo();
    this.storage?.removeItem('jwt_token');
    this.storage?.removeItem('user_rol');
  }

  estaAutenticado(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeTokenPayload(token);
      if (typeof payload['exp'] === 'number' && payload['exp'] * 1000 <= Date.now()) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  obtenerDatosUsuario(): { email: string, rol: string } {
    const token = this.getToken();
    const rolLocal = this.getRol() || 'Sin rol';

    if (!token) return { email: 'usuario@cacc.com.ar', rol: rolLocal };

    try {
      const decoded = this.decodeTokenPayload(token);

      return {
        email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded['email'] || 'usuario@cacc.com.ar',
        rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'] || decoded['rol'] || rolLocal
      };
    } catch {
      return { email: 'usuario@cacc.com.ar', rol: rolLocal };
    }
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  // El login es unico: cerrar sesion aca tambien invalida el token en el Portal Administrativo (y con el, en los dos portales).
  private cerrarSesionEnElAdministrativo(): void {
    const token = this.getToken();
    if (!token || typeof fetch === 'undefined') return;
    try {
      fetch(`${PORTALES.administrativoApi}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => undefined);
    } catch { /* si no hay conexion, la sesion local se cierra igual */ }
  }

  // El token compartido puede traer varios roles (por ejemplo el número del Administrativo y el nombre del rol deportivo):
  // se toma el primero que este portal reconoce.
  private elegirRol(payload: Record<string, any>): string | null {
    const crudo = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? payload['role'] ?? payload['rol'];
    const candidatos: unknown[] = Array.isArray(crudo) ? crudo : [crudo];
    const validos = candidatos.filter((r): r is string => typeof r === 'string' && normalizeRole(r) !== null);
    // El token del login unico trae el id del rol ("1") y su nombre ("Administrador (Tesorero)"): se prefiere el nombre,
    // que es lo que comparan y muestran las pantallas (boton de Seleccion de Portales, menu Staff, nombre en la barra).
    return validos.find((r) => !/^\d+$/.test(r.trim())) ?? validos[0] ?? null;
  }

  private decodeTokenPayload(token: string): Record<string, any> {
    const encoded = token.split('.')[1];
    if (!encoded) throw new Error('Invalid JWT');
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
}

