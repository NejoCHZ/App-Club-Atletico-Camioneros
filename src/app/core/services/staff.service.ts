import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Staff {
  idStaff?: number;
  idUsuario?: number;
  nombre: string;
  apellido: string;
  dni: string;
  rol: string;
  email?: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/staff`;

  getStaff(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('Error al cargar staff', err);
        return of([]);
      })
    );
  }
}
