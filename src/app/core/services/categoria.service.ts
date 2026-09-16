import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Categoria {
  idCategoria?: number;
  nombreCategoria: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categorias`;

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('Error al cargar categorias', err);
        return of([]);
      })
    );
  }
}
