import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Jugador } from '../models/jugador.model';

@Injectable({
  providedIn: 'root'
})
export class JugadorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/jugadores`;

  getJugadores(categoria?: string): Observable<Jugador[]> {
    // Si la API filtra por categoría, se puede enviar como parámetro
    const url = categoria ? `${this.apiUrl}?categoria=${encodeURIComponent(categoria)}` : this.apiUrl;
    return this.http.get<Jugador[]>(url);
  }

  getJugadorById(id: number): Observable<Jugador> {
    return this.http.get<Jugador>(`${this.apiUrl}/${id}`);
  }

  createJugador(jugador: Jugador): Observable<Jugador> {
    return this.http.post<Jugador>(this.apiUrl, jugador);
  }

  updateJugador(id: number, jugador: Jugador): Observable<Jugador> {
    return this.http.put<Jugador>(`${this.apiUrl}/${id}`, jugador);
  }

  deleteJugador(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
