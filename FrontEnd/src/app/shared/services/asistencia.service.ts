import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// verificado=false: el Portal Administrativo no respondió y el ingreso quedó marcado para revisar (la deuda es desconocida).
// estado es el que informa el Portal Administrativo (habilitado, solo_entrenamientos, inhabilitado, baja); nunca hay montos.
export interface IngresoResult { accesoPermitido: boolean; estadoAcceso?: 'PERMITIDO'|'DENEGADO'|'SIN_VERIFICAR'; asistenciaRegistrada: boolean; yaRegistrada: boolean; mensaje: string; verificado?: boolean; estado?: string; }
export interface AsistenciaHistorialItem {
  idAsistencia: number;
  idJugador: number;
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

  registrar(dni: string, metodoRegistro: MetodoRegistro = 'DNI_MANUAL'): Observable<IngresoResult> {
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
}
