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
}
