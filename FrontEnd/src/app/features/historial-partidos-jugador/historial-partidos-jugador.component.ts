import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface PartidoJugador {
  idPartido: number;
  fecha: string;
  fechaIso: string;
  rival: string;
  condicion: string;
  resultado: string;
  minutos: number;
  categoria: string;
}

@Component({
  selector: 'app-historial-partidos-jugador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-partidos-jugador.component.html',
  styleUrl: './historial-partidos-jugador.component.css',
})
export class HistorialPartidosJugadorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  playerId = 0;
  nombreCompleto = 'Jugador';
  dni = '';
  categoria = '';
  partidos: PartidoJugador[] = [];
  cargando = true;
  error = '';
  searchTerm = '';
  condicionFiltro = '';
  resultadoFiltro = '';
  ordenFiltro = 'fecha-desc';

  ngOnInit(): void {
    this.playerId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.playerId) || this.playerId <= 0) {
      this.error = 'El jugador solicitado no es válido.';
      this.cargando = false;
      return;
    }

    this.http.get<any>(`/api/jugadores/${this.playerId}`).subscribe({
      next: data => {
        this.nombreCompleto = `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim() || data.nombreCompleto || 'Jugador';
        this.dni = data.dni ?? '';
        this.categoria = data.categoria ?? data.nombreCategoria ?? '';
        this.partidos = (data.partidos ?? []).map((partido: any) => {
          const fechaIso = partido.fecha ? String(partido.fecha).split('T')[0] : '';
          return {
            idPartido: Number(partido.idPartido ?? 0),
            fecha: fechaIso ? new Date(`${fechaIso}T12:00:00`).toLocaleDateString('es-AR') : 'Sin informar',
            fechaIso,
            rival: partido.rival ?? 'Sin informar',
            condicion: partido.condicion ?? 'Sin informar',
            resultado: partido.resultado ?? 'Sin informar',
            minutos: Number(partido.minutos ?? 0),
            categoria: partido.categoria ?? this.categoria,
          };
        });
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el historial de partidos del jugador.';
        this.cargando = false;
      },
    });
  }

  get stats() {
    const ganados = this.partidos.filter(p => p.resultado.toUpperCase().startsWith('G')).length;
    const empatados = this.partidos.filter(p => p.resultado.toUpperCase().startsWith('E')).length;
    const perdidos = this.partidos.filter(p => p.resultado.toUpperCase().startsWith('P')).length;
    const minutos = this.partidos.reduce((total, partido) => total + partido.minutos, 0);
    return { total: this.partidos.length, ganados, empatados, perdidos, minutos };
  }

  get filteredPartidos(): PartidoJugador[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.partidos
      .filter(partido =>
        (!term || partido.rival.toLowerCase().includes(term) || partido.categoria.toLowerCase().includes(term)) &&
        (!this.condicionFiltro || partido.condicion.toLowerCase() === this.condicionFiltro.toLowerCase()) &&
        (!this.resultadoFiltro || partido.resultado.toUpperCase().startsWith(this.resultadoFiltro)))
      .sort((a, b) => {
        if (this.ordenFiltro === 'fecha-asc') return a.fechaIso.localeCompare(b.fechaIso);
        if (this.ordenFiltro === 'rival') return a.rival.localeCompare(b.rival);
        return b.fechaIso.localeCompare(a.fechaIso);
      });
  }

  volver(): void {
    const portal = this.router.url.split('/').filter(Boolean)[0] || 'admin';
    this.router.navigate(['/', portal, 'jugadores', this.playerId]);
  }
}
