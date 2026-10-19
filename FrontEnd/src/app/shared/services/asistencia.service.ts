import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// verificado=false: el Portal Administrativo no respondió y el ingreso quedó marcado para revisar (la deuda es desconocida).
export interface IngresoResult { accesoPermitido: boolean; asistenciaRegistrada: boolean; yaRegistrada: boolean; mensaje: string; verificado?: boolean; estado?: string; }
@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://127.0.0.1:5191/api/asistencias/verificar-y-registrar';
  registrar(dni: string): Observable<IngresoResult> { return this.http.post<IngresoResult>(this.url, { dni }); }
}
