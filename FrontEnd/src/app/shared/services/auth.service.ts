import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5191/api/auth';

  login(credenciales: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('jwt_token', response.token);

          // 1. Intentar leer rol desde el body
          let rolDetectado = response.rol || response.role || response.Rol;

          // 2. Si no vino en el body, extraerlo del payload del JWT
          if (!rolDetectado) {
            try {
              const payload = JSON.parse(atob(response.token.split('.')[1]));
              rolDetectado = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                || payload.role
                || payload.rol;
            } catch {
              rolDetectado = 'Tesorero';
            }
          }

          localStorage.setItem('user_rol', rolDetectado || 'Tesorero');
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getRol(): string | null {
    const rolLocal = localStorage.getItem('user_rol');
    if (rolLocal && rolLocal !== 'undefined' && rolLocal !== 'null') {
      return rolLocal;
    }

    // Respaldo: leer directo del token si user_rol estuviera vacío
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          || payload.role
          || payload.rol
          || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_rol');
  }

  estaAutenticado(): boolean {
    return !!this.getToken();
  }

  obtenerDatosUsuario(): { email: string, rol: string } {
    const token = this.getToken();
    const rolLocal = this.getRol() || 'Tesorero';

    if (!token) return { email: 'usuario@cacc.com.ar', rol: rolLocal };

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      return {
        email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || 'usuario@cacc.com.ar',
        rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.rol || rolLocal
      };
    } catch {
      return { email: 'usuario@cacc.com.ar', rol: rolLocal };
    }
  }
}
