import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Capability, RoleId, hasCapability, normalizeRole } from '../../core/auth/roles';

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

  getToken(): string | null {
    return this.storage?.getItem('jwt_token') ?? null;
  }

  getRol(): string | null {
    const rolLocal = this.storage?.getItem('user_rol');
    if (rolLocal && rolLocal !== 'undefined' && rolLocal !== 'null') {
      return rolLocal;
    }

    // Respaldo: leer directo del token si user_rol estuviera vacío
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeTokenPayload(token);
        return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          || payload['role']
          || payload['rol']
          || null;
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
      'preparador-fisico': RoleId.PreparadorFisico,
      'don-qr': RoleId.DonQr
    };
    return role ? roleIds[role] : null;
  }

  puede(capability: Capability): boolean {
    return hasCapability(this.getRoleId(), capability);
  }

  logout(): void {
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

  private decodeTokenPayload(token: string): Record<string, any> {
    const encoded = token.split('.')[1];
    if (!encoded) throw new Error('Invalid JWT');
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return JSON.parse(atob(base64));
  }
}

