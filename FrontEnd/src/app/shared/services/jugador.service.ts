import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearJugadorModel, JugadorModel } from '../models/jugador.model';

@Injectable({ providedIn: 'root' })
export class JugadorService {
  private http = inject(HttpClient);
  // Apunta directamente a tu API en C#
  private apiUrl = 'http://localhost:5191/api/jugadores';

  // Obtener la lista completa
  obtenerJugadores(): Observable<JugadorModel[]> {
    return this.http.get<JugadorModel[]>(this.apiUrl);
  }

  // Alias por si lo usás en otras partes de tu código con este nombre
  obtenerTodos(): Observable<JugadorModel[]> {
    return this.http.get<JugadorModel[]>(this.apiUrl);
  }

  // Obtener un jugador específico
  obtenerPorId(id: string | number): Observable<JugadorModel> {
    return this.http.get<JugadorModel>(`${this.apiUrl}/${id}`);
  }

  // Enviar un nuevo jugador a la base de datos
  crear(jugador: CrearJugadorModel): Observable<JugadorModel> {
    return this.http.post<JugadorModel>(this.apiUrl, jugador);
  }

  // Actualizar un jugador existente
  actualizar(id: string | number, jugador: Partial<CrearJugadorModel>): Observable<JugadorModel> {
    return this.http.put<JugadorModel>(`${this.apiUrl}/${id}`, jugador);
  }

  actualizarPerfil(id: string | number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos);
  }

  // Eliminar / Dar de baja un jugador
  eliminar(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
