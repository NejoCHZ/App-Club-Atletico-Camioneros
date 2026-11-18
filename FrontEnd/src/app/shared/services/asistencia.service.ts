import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type EstadoRegistroAsistencia = 'REGISTRADA' | 'YA_REGISTRADA';
export interface IngresoResult { accesoPermitido: boolean; estadoAcceso: 'PERMITIDO'|'DENEGADO'; estadoRegistro: EstadoRegistroAsistencia; asistenciaRegistrada: boolean; yaRegistrada: boolean; mensaje: string; deudaTotal: number; cuotasVencidas: number; }
export interface AsistenciaHistorialItem {
  idAsistencia: number;
  idJugador: number | null;
  idStaff: number | null;
  fechaHora: string;
  estadoAcceso: string;
  observaciones: string | null;
}

export interface AsistenciaHistorialFiltros {
  desde?: string;
  hasta?: string;
  estado?: string;
}
export type MetodoRegistro = 'DNI_MANUAL'|'QR';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/asistencias';

  registrar(dni: string, metodoRegistro: MetodoRegistro): Observable<IngresoResult> {
    return this.http.post<IngresoResult>(`${this.baseUrl}/verificar-y-registrar`, { dni, metodoRegistro });
  }

  obtenerHistorial(
    idJugador: number,
    filtros: AsistenciaHistorialFiltros = {},
  ): Observable<AsistenciaHistorialItem[]> {
    let params = new HttpParams();
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<AsistenciaHistorialItem[]>(
      `${this.baseUrl}/jugador/${idJugador}`,
      { params },
    );
  }

  obtenerHistorialStaff(
    idStaff: number,
    filtros: AsistenciaHistorialFiltros = {},
  ): Observable<AsistenciaHistorialItem[]> {
    let params = new HttpParams();
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<AsistenciaHistorialItem[]>(
      `${this.baseUrl}/staff/${idStaff}`,
      { params },
    );
  }
}
