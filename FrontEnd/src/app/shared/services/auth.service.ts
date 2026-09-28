import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5191/api/auth'; // La URL de tu backend

  login(credenciales: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(response => {
        // Cuando el backend responde OK, guardamos el token y el rol
        if (response && response.token) {
          localStorage.setItem('jwt_token', response.token);
          localStorage.setItem('user_rol', response.rol);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getRol(): string | null {
    return localStorage.getItem('user_rol');
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

      // .NET serializa los claims con estas URLs estándar por defecto
      return {
        email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || 'usuario@cacc.com.ar',
        rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.rol || rolLocal
      };
    } catch (e) {
      return { email: 'usuario@cacc.com.ar', rol: rolLocal };
    }
  }
}
