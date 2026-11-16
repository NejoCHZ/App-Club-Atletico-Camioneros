import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { PortalAccessService } from '../auth/portal-access.service';
import { ClubPortalApiService } from './club-portal-api.service';

export interface RolePlayerRow { id: number; nombreCompleto: string; dni: string; posicion: string; edad: string; categoria: string; fechaNacimiento: string; }
export interface RoleCategoryRow { id: number; nombre: string; cantidadJugadores: string; asociacion: string; }
export interface RolePlayerProfile {
  id: number; nombreCompleto: string; posicion: string; fechaNacimiento: string; edad: string;
  peso: string; altura: string; pieHabil: string; grupoSanguineo: string; tutor: string;
  telefonoTutor: string; domicilio: string; patologias: string; lesiones: string[];
  observacionesMedicas: string; historialPartidos: any[]; totalMinutosJugados: string;
}

@Injectable({ providedIn: 'root' })
export class RolePlayerViewService {
  private readonly api = inject(ClubPortalApiService);
  private readonly access = inject(PortalAccessService);
  private readonly medicalIds = new Map<number, number>();

  players(): Observable<RolePlayerRow[]> {
    // The API is authoritative for DT membership (including bridge-table assignments).
    return this.api.listPlayers().pipe(
      map(rows => this.access.visiblePlayers(rows).map(row => this.toRow(row))),
    );
  }

  categoryPlayers(categoryId: number): Observable<RolePlayerRow[]> {
    return this.api.listRoster(categoryId).pipe(map(rows => rows.map(row => this.toRow(row))));
  }

  categories(dtOnly = false): Observable<RoleCategoryRow[]> {
    return this.api.listCategories().pipe(map(rows => {
      return (dtOnly ? this.access.visibleCategories(rows) : rows)
        .map(row => ({ id: row.idCategoria, nombre: row.nombreCategoria, cantidadJugadores: String(row.cantidadJugadores ?? 0), asociacion: row.asociacion ?? '' }));
    }));
  }

  profile(id: number): Observable<RolePlayerProfile> {
    return forkJoin({
      player: this.api.getPlayer(id), medical: this.api.getMedicalRecord(id),
    }).pipe(map(({ player, medical }) => { this.medicalIds.set(id, medical.idFichaMedica); return this.toProfile(player, medical); }));
  }

  saveMedical(id: number, profile: RolePlayerProfile): Observable<unknown> {
    return this.api.savePlayerMedicalData(profile.id, {
      peso: this.parseMeasurement(profile.peso),
      altura: this.parseHeight(profile.altura),
      pieHabil: profile.pieHabil?.trim() || null,
      grupoSanguineo: profile.grupoSanguineo?.trim() || null,
      antecedentesSalud: profile.patologias,
      historialLesiones: profile.lesiones.join('\n'),
      observaciones: profile.observacionesMedicas,
    });
  }

  private parseMeasurement(value: string): number | null {
    const normalized = String(value ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0];
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseHeight(value: string): number | null {
    const parsed = this.parseMeasurement(value);
    return parsed != null && parsed > 3 && parsed <= 300 ? parsed / 100 : parsed;
  }

  private toRow(row: any): RolePlayerRow {
    const birth = row.fechaDeNacimiento ?? row.fechaNacimiento;
    const birthDate = this.parseDate(birth);
    const today = new Date();
    let age = birthDate ? today.getFullYear() - birthDate.getFullYear() : 0;
    if (birthDate && (today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()))) {
      age--;
    }
    return {
      id: row.idJugador ?? row.id,
      nombreCompleto: row.nombreCompleto ?? `${row.nombre ?? ''} ${row.apellido ?? ''}`.trim(),
      dni: row.dni ?? '',
      posicion: String(row.posicionCancha ?? row.posicion ?? '').toUpperCase(),
      edad: age ? `${age} AÑOS` : 'SIN INFORMAR',
      categoria: row.nombreCategoria ?? row.categoria ?? 'Sin categoría',
      fechaNacimiento: birthDate ? birthDate.toLocaleDateString('es-AR') : 'Sin informar',
    };
  }

  private parseDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    const text = String(value).trim();
    const localDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
    const date = localDate
      ? new Date(Number(localDate[3]), Number(localDate[2]) - 1, Number(localDate[1]))
      : new Date(text);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toProfile(player: any, medical: any): RolePlayerProfile {
    const row = this.toRow(player);
    const tutor = player.tutor ?? {};
    return {
      ...row, fechaNacimiento: player.fechaDeNacimiento ?? player.fechaNacimiento ?? 'Sin informar',
      peso: player.peso != null ? String(player.peso) : '', altura: player.altura != null ? String(player.altura) : '',
      pieHabil: player.pieHabil ?? '', grupoSanguineo: medical?.grupoSanguineo ?? '',
      tutor: `${tutor.nombre ?? ''} ${tutor.apellido ?? ''}`.trim() || 'Sin informar', telefonoTutor: tutor.telefono ?? 'Sin informar',
      domicilio: player.domicilio ?? 'Sin informar', patologias: medical?.antecedentesSalud ?? medical?.patologias ?? '',
      lesiones: String(medical?.historialLesiones ?? '').split(/\r?\n/).filter(Boolean), observacionesMedicas: medical?.observaciones ?? '',
      historialPartidos: player.partidos ?? [], totalMinutosJugados: `${(player.partidos ?? []).reduce((sum: number, game: any) => sum + Number(game.minutos ?? 0), 0)}'`,
    };
  }
}
