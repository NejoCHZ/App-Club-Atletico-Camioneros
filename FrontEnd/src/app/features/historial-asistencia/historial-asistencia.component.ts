import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import {
  AsistenciaHistorialFiltros,
  AsistenciaHistorialItem,
  AsistenciaService,
} from '../../shared/services/asistencia.service';
import { JugadorService } from '../../shared/services/jugador.service';

interface PersonaResumen {
  nombre: string;
  apellido: string;
  dni: string;
  categoria: string;
}

interface ObservacionPresentada {
  metodo: string | null;
  detalle: string | null;
}

@Component({
  selector: 'app-historial-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-asistencia.component.html',
  styleUrl: './historial-asistencia.component.css',
})
export class HistorialAsistenciaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly jugadorService = inject(JugadorService);
  private readonly http = inject(HttpClient);
  private readonly access = inject(PortalAccessService);

  readonly role = this.access.role;
  idEntidad = 0;
  esStaff = false;
  persona: PersonaResumen | null = null;
  asistencias: AsistenciaHistorialItem[] = [];
  desde = '';
  hasta = '';
  estado = '';
  cargando = true;
  error = '';
  errorFiltros = '';

  ngOnInit(): void {
    this.esStaff = this.route.snapshot.data?.['entityType'] === 'staff';
    this.idEntidad = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.idEntidad) || this.idEntidad <= 0) {
      this.error = `${this.esStaff ? 'El colaborador' : 'El jugador'} solicitado no es válido.`;
      this.cargando = false;
      return;
    }

    const resumen$ = this.esStaff
      ? this.http.get<any>(`/api/staff/${this.idEntidad}`)
      : this.jugadorService.obtenerPorId(String(this.idEntidad));
    resumen$.subscribe({
      next: (data: any) => {
        this.persona = {
          nombre: data.nombre || data.Nombre || '',
          apellido: data.apellido || data.Apellido || '',
          dni: data.dni || data.Dni || '',
          categoria: this.esStaff
            ? data.categoriaAsignada || data.CategoriaAsignada || 'Todas / General'
            : data.nombreCategoria || data.NombreCategoria || 'Sin categoría',
        };
      },
      error: () => {
        this.error = `No se pudo cargar la información del ${this.esStaff ? 'colaborador' : 'jugador'}.`;
      },
    });

    this.buscar();
  }

  buscar(): void {
    this.errorFiltros = '';
    if (this.desde && this.hasta && this.desde > this.hasta) {
      this.errorFiltros = 'La fecha desde no puede ser posterior a la fecha hasta.';
      return;
    }

    const filtros: AsistenciaHistorialFiltros = {
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
      estado: this.estado || undefined,
    };

    this.cargando = true;
    this.error = '';
    const historial$ = this.esStaff
      ? this.asistenciaService.obtenerHistorialStaff(this.idEntidad, filtros)
      : this.asistenciaService.obtenerHistorial(this.idEntidad, filtros);
    historial$.subscribe({
      next: asistencias => {
        this.asistencias = asistencias;
        this.cargando = false;
      },
      error: () => {
        this.asistencias = [];
        this.error = 'No se pudo cargar el historial de asistencia.';
        this.cargando = false;
      },
    });
  }

  limpiarFiltros(): void {
    this.desde = '';
    this.hasta = '';
    this.estado = '';
    this.buscar();
  }

  presentarObservacion(observaciones: string | null): ObservacionPresentada {
    const valor = observaciones?.trim();
    if (!valor) return { metodo: null, detalle: null };

    const partes = valor.split(';').map(parte => parte.trim()).filter(Boolean);
    const campos = new Map<string, string>();
    for (const parte of partes) {
      const separador = parte.indexOf('=');
      if (separador <= 0) continue;
      campos.set(parte.slice(0, separador).trim().toLowerCase(), parte.slice(separador + 1).trim());
    }

    if (!campos.has('method') && !campos.has('detail')) {
      return { metodo: null, detalle: valor };
    }

    const metodo = this.nombreMetodo(campos.get('method'));
    const detalleTecnico = campos.get('detail')?.trim() || null;
    const detalle = detalleTecnico && !this.esDetalleDePrueba(detalleTecnico) ? detalleTecnico : null;
    return { metodo, detalle };
  }

  volverAlPerfil(): void {
    void this.router.navigate(['/', this.role, this.esStaff ? 'staff' : 'jugadores', this.idEntidad]);
  }

  private nombreMetodo(method?: string): string | null {
    if (!method) return null;
    const metodos: Record<string, string> = {
      DNI_MANUAL: 'Registro manual por DNI',
      QR: 'Lectura de código QR',
      QR_SCAN: 'Lectura de código QR',
    };
    return metodos[method.toUpperCase()] || 'Registro de ingreso';
  }

  private esDetalleDePrueba(detalle: string): boolean {
    return /^(http\s+integration\s+test|integration\s+test)$/i.test(detalle);
  }
}
