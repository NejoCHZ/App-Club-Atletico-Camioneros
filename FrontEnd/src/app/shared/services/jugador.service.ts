import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { CrearJugadorModel, JugadorModel, PosicionJugador, TutorModel } from '../models/jugador.model';

@Injectable({ providedIn: 'root' })
export class JugadorService {
  private readonly apiUrl = 'http://localhost:5031/api/jugadores';

  constructor(private readonly http: HttpClient) {}

  obtenerTodos(): Observable<JugadorModel[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map((respuesta) => {
        if (!Array.isArray(respuesta)) {
          throw new Error('La API devolvió un formato de jugadores inválido.');
        }

        return respuesta.map((jugador, indice) => this.mapearJugador(jugador, `en la posición ${indice}`));
      })
    );
  }

  obtenerPorId(id: string): Observable<JugadorModel> {
    return this.http.get<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      map((respuesta) => this.mapearJugador(respuesta, 'solicitado'))
    );
  }

  crear(jugador: CrearJugadorModel): Observable<JugadorModel> {
    return this.http.post<unknown>(this.apiUrl, jugador).pipe(
      map((respuesta) => this.mapearJugador(respuesta, 'creado'))
    );
  }

  private mapearJugador(valor: unknown, referencia: string): JugadorModel {
    if (!this.esRegistro(valor)) {
      throw new Error(`El jugador ${referencia} no tiene un formato válido.`);
    }

    const id = this.leerTexto(valor, 'id');
    const dni = this.leerTexto(valor, 'dni');
    const nombre = this.leerTexto(valor, 'nombre');
    const apellido = this.leerTexto(valor, 'apellido');
    const fechaNacimiento = this.leerTexto(valor, 'fechaNacimiento');
    const categoria = this.leerTexto(valor, 'categoria');
    const posicion = this.leerPosicion(valor, 'posicion');
    const clubOrigen = this.leerTextoOpcional(valor, 'clubOrigen');
    const aptoFisico = valor['aptoFisico'];
    const tutor = this.mapearTutor(valor['tutor']);

    if (!id || !dni || !nombre || !apellido || !fechaNacimiento || !categoria || !posicion || typeof aptoFisico !== 'boolean') {
      throw new Error(`El jugador ${referencia} tiene campos obligatorios inválidos.`);
    }

    return { id, dni, nombre, apellido, fechaNacimiento, categoria, posicion, clubOrigen, aptoFisico, tutor };
  }

  private mapearTutor(valor: unknown): TutorModel | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    if (!this.esRegistro(valor)) {
      throw new Error('El tutor del jugador no tiene un formato válido.');
    }

    const dni = this.leerTexto(valor, 'dni');
    const nombre = this.leerTexto(valor, 'nombre');
    const apellido = this.leerTexto(valor, 'apellido');
    const telefono = this.leerTexto(valor, 'telefono');
    const email = this.leerTexto(valor, 'email');

    if (!dni || !nombre || !apellido || !telefono || !email) {
      throw new Error('El tutor del jugador tiene campos obligatorios inválidos.');
    }

    return { dni, nombre, apellido, telefono, email };
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null;
  }

  private leerTexto(registro: Record<string, unknown>, campo: string): string | null {
    const valor = registro[campo];
    return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
  }

  private leerTextoOpcional(registro: Record<string, unknown>, campo: string): string | null {
    const valor = registro[campo];
    return valor === null || valor === undefined ? null : this.leerTexto(registro, campo);
  }

  private leerPosicion(registro: Record<string, unknown>, campo: string): PosicionJugador | null {
    const posicion = this.leerTexto(registro, campo)?.toUpperCase();
    return posicion === 'ARQUERO' || posicion === 'DEFENSOR' || posicion === 'VOLANTE' || posicion === 'DELANTERO'
      ? posicion
      : null;
  }
}
