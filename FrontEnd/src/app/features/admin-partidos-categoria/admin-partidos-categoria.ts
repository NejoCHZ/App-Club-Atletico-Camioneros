import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

export interface PartidoItem {
  idPartido: number;
  idCategoria: number;
  categoria: string;
  fecha: string;
  fechaIso: string;
  rival: string;
  condicion: string;
  resultado: string;
  observaciones?: string;
}

export interface JugadorPlantelMinuto {
  idJugador: number;
  nombreCompleto: string;
  dni: string;
  minutosJugados: number;
}

@Component({
  selector: 'app-admin-partidos-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-partidos-categoria.html',
  styleUrl: './admin-partidos-categoria.css'
})
export class AdminPartidosCategoria implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  categoriaId: number = 0;
  categoriaNombre: string = 'Cargando...';

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  condicionFiltro = '';
  resultadoFiltro = '';
  ordenFiltro = '';
  activeTab = 'Categorias';

  menuUsuarioAbierto = false;
  sidebarOculto = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: true }
  ];

  partidos: PartidoItem[] = [];
  cargando = false;

  // Modales
  modalFormVisible = false;
  modoEdicion = false;
  partidoIdSeleccionado = 0;
  guardando = false;

  modalEliminarVisible = false;
  partidoAEliminar: PartidoItem | null = null;
  eliminando = false;

  modalDetalleVisible = false;
  partidoDetalle: any = null;

  // Formulario de Partido
  fechaPartido = '';
  rival = '';
  condicionLocalia = 'Local';
  tipoResultado = 'G'; // G, E, P
  marcador = ''; // ej: "2-1"
  observaciones = '';
  jugadoresMinutos: JugadorPlantelMinuto[] = [];

  ngOnInit(): void {
    this.cargarUsuario();
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.categoriaId = Number(id);
        this.cargarDatosCategoria();
        this.cargarPartidos();
      }
    });
  }

  limpiarNombreRol(rol: string): string {
    if (!rol) return '';
    let r = rol.replace(/\s*\([^)]*\)/gi, '').trim();
    if (r.toLowerCase() === 'tesorero') r = 'Administrador';
    return r;
  }

  private cargarUsuario(): void {
    const token = this.authService.getToken();
    const rol = this.authService.getRol() || 'Administrador';

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
          || payload.email
          || '';

        this.usuarioActual = {
          nombre: this.limpiarNombreRol(rol),
          email: email
        };
      } catch {
        this.usuarioActual = { nombre: this.limpiarNombreRol(rol), email: '' };
      }
    }
  }

  cargarDatosCategoria(): void {
    this.http.get<any>(`http://localhost:5191/api/categorias/${this.categoriaId}`).subscribe({
      next: (data) => {
        this.categoriaNombre = data.nombreCategoria || 'División';
      },
      error: () => this.categoriaNombre = 'División'
    });
  }

  cargarPartidos(): void {
    this.cargando = true;
    this.http.get<any[]>(`http://localhost:5191/api/categorias/${this.categoriaId}/partidos`).subscribe({
      next: (data) => {
        this.cargando = false;
        this.partidos = data.map(p => {
          const d = new Date(p.fecha);
          return {
            idPartido: p.idPartido,
            idCategoria: p.idCategoria,
            categoria: p.categoria,
            fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            fechaIso: p.fecha ? p.fecha.split('T')[0] : '',
            rival: p.rival,
            condicion: p.condicion || 'Local',
            resultado: p.resultado,
            observaciones: p.observaciones
          };
        });
      },
      error: () => this.cargando = false
    });
  }

  get stats() {
    let ganados = 0;
    let empatados = 0;
    let perdidos = 0;
    this.partidos.forEach(p => {
      const r = (p.resultado || '').toUpperCase();
      if (r.startsWith('G')) ganados++;
      else if (r.startsWith('E')) empatados++;
      else if (r.startsWith('P')) perdidos++;
    });
    return { ganados, empatados, perdidos, total: this.partidos.length };
  }

  get filteredPartidos(): PartidoItem[] {
    return this.partidos
      .filter(p => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term || p.rival.toLowerCase().includes(term);
        const matchCond = !this.condicionFiltro || p.condicion.toUpperCase() === this.condicionFiltro.toUpperCase();
        const matchRes = !this.resultadoFiltro || p.resultado.toUpperCase().startsWith(this.resultadoFiltro);
        return matchSearch && matchCond && matchRes;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'rival') {
          return a.rival.localeCompare(b.rival);
        }
        return 0; // Por defecto orden descendente por fecha recibido de la API
      });
  }

  abrirNuevoPartido(): void {
    this.modoEdicion = false;
    this.partidoIdSeleccionado = 0;
    this.fechaPartido = new Date().toISOString().split('T')[0];
    this.rival = '';
    this.condicionLocalia = 'Local';
    this.tipoResultado = 'G';
    this.marcador = '';
    this.observaciones = '';

    this.http.get<any[]>(`http://localhost:5191/api/categorias/${this.categoriaId}/jugadores`).subscribe({
      next: (data) => {
        this.jugadoresMinutos = data.map(j => ({
          idJugador: j.idJugador,
          nombreCompleto: j.nombreCompleto,
          dni: j.dni,
          minutosJugados: 90
        }));
        this.modalFormVisible = true;
      }
    });
  }

  abrirEditarPartido(p: PartidoItem): void {
    this.modoEdicion = true;
    this.partidoIdSeleccionado = p.idPartido;
    this.fechaPartido = p.fechaIso || '';
    this.rival = p.rival;
    this.condicionLocalia = p.condicion;
    this.observaciones = p.observaciones || '';

    const partes = (p.resultado || '').trim().split(' ');
    if (partes.length >= 2) {
      this.tipoResultado = partes[0].toUpperCase();
      this.marcador = partes.slice(1).join(' ');
    } else {
      this.tipoResultado = 'G';
      this.marcador = p.resultado;
    }

    this.http.get<any>(`http://localhost:5191/api/categorias/${this.categoriaId}/partidos/${p.idPartido}`).subscribe({
      next: (detalle) => {
        this.http.get<any[]>(`http://localhost:5191/api/categorias/${this.categoriaId}/jugadores`).subscribe({
          next: (plantel) => {
            this.jugadoresMinutos = plantel.map(j => {
              const jugado = (detalle.jugadoresMinutos || []).find((jm: any) => jm.idJugador === j.idJugador);
              return {
                idJugador: j.idJugador,
                nombreCompleto: j.nombreCompleto,
                dni: j.dni,
                minutosJugados: jugado ? jugado.minutosJugados : 0
              };
            });
            this.modalFormVisible = true;
          }
        });
      }
    });
  }

  guardarPartido(): void {
    if (!this.fechaPartido || !this.rival.trim() || !this.marcador.trim()) {
      alert('Complete la fecha, el equipo rival y el marcador (ej: 2-1).');
      return;
    }

    const resultadoFinal = `${this.tipoResultado} ${this.marcador.trim()}`.trim();
    const payload = {
      fechaPartido: this.fechaPartido,
      rival: this.rival.trim(),
      condicionLocalia: this.condicionLocalia,
      resultado: resultadoFinal,
      observaciones: this.observaciones.trim() || null,
      jugadoresMinutos: this.jugadoresMinutos.map(j => ({
        idJugador: j.idJugador,
        minutosJugados: Number(j.minutosJugados) || 0
      }))
    };

    this.guardando = true;
    if (this.modoEdicion) {
      this.http.put(`http://localhost:5191/api/categorias/${this.categoriaId}/partidos/${this.partidoIdSeleccionado}`, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.modalFormVisible = false;
          this.cargarPartidos();
        },
        error: (err) => {
          this.guardando = false;
          alert('Error al actualizar: ' + (err.error?.message || 'Error del servidor'));
        }
      });
    } else {
      this.http.post(`http://localhost:5191/api/categorias/${this.categoriaId}/partidos`, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.modalFormVisible = false;
          this.cargarPartidos();
        },
        error: (err) => {
          this.guardando = false;
          alert('Error al registrar: ' + (err.error?.message || 'Error del servidor'));
        }
      });
    }
  }

  verDetalle(p: PartidoItem): void {
    this.http.get<any>(`http://localhost:5191/api/categorias/${this.categoriaId}/partidos/${p.idPartido}`).subscribe({
      next: (data) => {
        this.partidoDetalle = data;
        this.modalDetalleVisible = true;
      }
    });
  }

  abrirEliminar(p: PartidoItem): void {
    this.partidoAEliminar = p;
    this.modalEliminarVisible = true;
  }

  confirmarEliminar(): void {
    if (!this.partidoAEliminar) return;

    this.eliminando = true;
    this.http.delete(`http://localhost:5191/api/categorias/${this.categoriaId}/partidos/${this.partidoAEliminar.idPartido}`).subscribe({
      next: () => {
        this.eliminando = false;
        this.modalEliminarVisible = false;
        this.partidoAEliminar = null;
        this.cargarPartidos();
      },
      error: (err) => {
        this.eliminando = false;
        alert('Error al eliminar: ' + (err.error?.message || 'Error del servidor'));
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/categorias']);
  }

  toggleSidebar(): void {
    this.sidebarOculto = !this.sidebarOculto;
  }

  toggleMenuUsuario(event: MouseEvent): void {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }

  @HostListener('document:click')
  cerrarMenus(): void {
    this.menuUsuarioAbierto = false;
  }

  irASeleccionPortales(): void {
    this.router.navigate(['/seleccion-portales']);
  }

  irAConfiguracion(): void {
    alert('Módulo de configuración de cuenta en desarrollo.');
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  selectNav(label: string): void {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Inicio') this.router.navigate(['/admin']);
    else if (label === 'Jugadores') this.router.navigate(['/admin/lista-jugadores']);
    else if (label === 'Categorias' || label === 'Categorías') this.router.navigate(['/admin/categorias']);
    else if (label === 'Staff') this.router.navigate(['/admin/staff']);
  }
}
