import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategorySummary, MedicalRecord, PlayerProfile, PlayerSummary, RosterPlayer } from '../models/portal.models';

const API_ROOT = '/api';

@Injectable({ providedIn: 'root' })
export class ClubPortalApiService {
  private readonly http = inject(HttpClient);

  listPlayers(): Observable<PlayerSummary[]> {
    return this.http.get<PlayerSummary[]>(`${API_ROOT}/jugadores`);
  }

  getPlayer(playerId: number): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${API_ROOT}/jugadores/${playerId}`);
  }

  savePlayerPhysicalData(playerId: number, data: { peso: number | null; altura: number | null; pieHabil: string | null }): Observable<void> {
    return this.http.put<void>(`${API_ROOT}/jugadores/${playerId}/datos-fisicos`, data);
  }

  savePlayerMedicalData(playerId: number, data: {
    peso: number | null; altura: number | null; pieHabil: string | null; grupoSanguineo: string | null;
    antecedentesSalud: string; historialLesiones: string; observaciones: string;
  }): Observable<void> {
    return this.http.put<void>(`${API_ROOT}/jugadores/${playerId}/datos-medicos`, data);
  }

  listCategories(): Observable<CategorySummary[]> {
    return this.http.get<CategorySummary[]>(`${API_ROOT}/categorias`);
  }

  getCategory(categoryId: number): Observable<CategorySummary> {
    return this.http.get<CategorySummary>(`${API_ROOT}/categorias/${categoryId}`);
  }

  listRoster(categoryId: number): Observable<RosterPlayer[]> {
    return this.http.get<RosterPlayer[]>(`${API_ROOT}/categorias/${categoryId}/jugadores`);
  }

  listAvailablePlayers(categoryId: number, query = ''): Observable<RosterPlayer[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<RosterPlayer[]>(`${API_ROOT}/categorias/${categoryId}/jugadores-disponibles`, { params });
  }

  addPlayerToCategory(categoryId: number, playerId: number): Observable<void> {
    return this.http.post<void>(`${API_ROOT}/categorias/${categoryId}/jugadores`, { idJugador: playerId });
  }

  removePlayerFromCategory(categoryId: number, playerId: number): Observable<void> {
    return this.http.delete<void>(`${API_ROOT}/categorias/${categoryId}/jugadores/${playerId}`);
  }

  getMedicalRecord(playerId: number): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${API_ROOT}/fichas-medicas/jugador/${playerId}`);
  }

  saveMedicalRecord(record: MedicalRecord): Observable<void> {
    return this.http.put<void>(`${API_ROOT}/fichas-medicas/${record.idFichaMedica}`, record);
  }
}

