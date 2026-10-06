import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

export interface CategoriaItem {
  id: number;
  nombre: string;
  cantidadJugadoresNum: number;
  cantidadStaffNum: number;
  cantidadJugadores: string;
  cantidadStaff: string;
  asociacion: string;
}

export interface JugadorCategoria {
  idJugador: number;
  nombreCompleto: string;
  dni: string;
  posicionCancha: string;
  fechaNacimiento?: string;
  minutosJugados?: number;
}

export interface StaffCategoria {
  idStaff: number;
  nombreCompleto: string;
  dni: string;
  rol: string;
  email: string;
}

export interface PartidoItem {
  idPartido: number;
  fecha: string;
  rival: string;
  condicion: string;
  resultado: string;
}

@Component({
  selector: 'app-admin-lista-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-categoria.html',
  styleUrl: './admin-lista-categoria.css',
})
export class AdminListaCategoria implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  asociacionFiltro = '';
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

  categorias: CategoriaItem[] = [];

  // Modales de Categoría (Crear/Editar)
  modalCategoriaVisible = false;
  modoEdicion = false;
  categoriaFormId: number = 0;
  categoriaFormNombre: string = '';
  categoriaFormAsociacion: string = 'Liga Cordobesa';

  // Modal de Confirmación de Eliminación
  modalEliminarVisible = false;
  categoriaAEliminar: CategoriaItem | null = null;
  eliminando = false;

  // Modal de Detalle (Jugadores, Cuerpo Técnico y Partidos)
  modalPlantelVisible = false;
  categoriaActiva: CategoriaItem | null = null;
  tabActivaModal: 'jugadores' | 'staff' | 'partidos' = 'jugadores';

  // Submódulo: Jugadores con buscador reactivo
  jugadoresPlantel: JugadorCategoria[] = [];
  jugadoresDisponibles: JugadorCategoria[] = [];
  busquedaJugadorTexto = '';
  jugadorSeleccionadoId: number | null = null;
  cargandoPlantel = false;
  private debounceJugadorTimer: any;

  // Submódulo: Cuerpo Técnico con buscador reactivo
  staffPlantel: StaffCategoria[] = [];
  staffDisponibles: StaffCategoria[] = [];
  busquedaStaffTexto = '';
  staffSeleccionadoId: number | null = null;
  cargandoStaff = false;
  private debounceStaffTimer: any;

  // Submódulo: Partidos
  partidosCategoria: PartidoItem[] = [];
  cargandoPartidos = false;
  mostrarFormPartido = false;
  guardandoPartido = false;

  tipoResultadoSeleccionado: string = 'G'; // 'G' | 'E' | 'P'
  marcadorResultado: string = ''; // ej. "2-1"

  partidoForm = {
    fechaPartido: '',
    rival: '',
    condicionLocalia: 'Local',
    resultado: '',
    observaciones: ''
  };

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDatos();
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

  cargarDatos(): void {
    this.http.get<any[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.categorias = data.map(c => {
          const cantJug = c.cantidadJugadores || 0;
          const cantStf = c.cantidadStaff || 0;
          const asoc = c.asociacion || ((c.nombreCategoria || '').toUpperCase().includes('AFA') ? 'AFA' : 'Liga Cordobesa');
          return {
            id: c.idCategoria,
            nombre: c.nombreCategoria,
            cantidadJugadoresNum: cantJug,
            cantidadStaffNum: cantStf,
            cantidadJugadores: `${cantJug} JUGADORES`,
            cantidadStaff: `${cantStf} CUERPO TÉCNICO`,
            asociacion: asoc
          };
        });
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  get filteredCategorias(): CategoriaItem[] {
    return this.categorias
      .filter(c => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term || c.nombre.toLowerCase().includes(term);
        const matchAso = !this.asociacionFiltro || c.asociacion.toLowerCase() === this.asociacionFiltro.toLowerCase();
        return matchSearch && matchAso;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') {
          return a.nombre.localeCompare(b.nombre);
        }
        if (this.ordenFiltro === 'jugadores_desc') {
          return b.cantidadJugadoresNum - a.cantidadJugadoresNum;
        }
        if (this.ordenFiltro === 'jugadores_asc') {
          return a.cantidadJugadoresNum - b.cantidadJugadoresNum;
        }
        if (this.ordenFiltro === 'staff_desc') {
          return b.cantidadStaffNum - a.cantidadStaffNum;
        }
        return 0;
      });
  }

  // --- Crear / Editar Categoría con Asociación ---
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.categoriaFormId = 0;
    this.categoriaFormNombre = '';
    this.categoriaFormAsociacion = 'Liga Cordobesa';
    this.modalCategoriaVisible = true;
  }

  abrirModalEditar(cat: CategoriaItem): void {
    this.modoEdicion = true;
    this.categoriaFormId = cat.id;
    this.categoriaFormNombre = cat.nombre;
    this.categoriaFormAsociacion = cat.asociacion || 'Liga Cordobesa';
    this.modalCategoriaVisible = true;
  }

  cerrarModalCategoria(): void {
    this.modalCategoriaVisible = false;
  }

  guardarCategoria(): void {
    if (!this.categoriaFormNombre.trim()) {
      alert('Ingrese el nombre de la categoría.');
      return;
    }

    const payload = {
      nombreCategoria: this.categoriaFormNombre.trim(),
      asociacion: this.categoriaFormAsociacion || 'Liga Cordobesa'
    };

    if (this.modoEdicion) {
      this.http.put(`http://localhost:5191/api/categorias/${this.categoriaFormId}`, payload).subscribe({
        next: () => {
          this.cerrarModalCategoria();
          this.cargarDatos();
        },
        error: (err) => alert('Error al actualizar la categoría: ' + (err.error?.message || 'Error del servidor'))
      });
    } else {
      this.http.post('http://localhost:5191/api/categorias', payload).subscribe({
        next: () => {
          this.cerrarModalCategoria();
          this.cargarDatos();
        },
        error: (err) => alert('Error al crear la categoría: ' + (err.error?.message || 'Error del servidor'))
      });
    }
  }

  // --- Eliminar Categoría ---
  abrirModalEliminarCategoria(cat: CategoriaItem): void {
    this.categoriaAEliminar = cat;
    this.modalEliminarVisible = true;
  }

  cancelarEliminarCategoria(): void {
    this.modalEliminarVisible = false;
    this.categoriaAEliminar = null;
  }

  confirmarEliminarCategoria(): void {
    if (!this.categoriaAEliminar) return;

    this.eliminando = true;
    const id = this.categoriaAEliminar.id;

    this.http.delete(`http://localhost:5191/api/categorias/${id}`).subscribe({
      next: () => {
        this.eliminando = false;
        this.modalEliminarVisible = false;
        this.categoriaAEliminar = null;
        this.cargarDatos();
      },
      error: (err) => {
        this.eliminando = false;
        alert('Error al eliminar la categoría: ' + (err.error?.message || 'Error del servidor'));
      }
    });
  }

  // --- Modal de Gestión (Jugadores, Cuerpo Técnico y Partidos) ---
  verCategoria(cat: CategoriaItem): void {
    this.categoriaActiva = cat;
    this.tabActivaModal = 'jugadores';
    this.modalPlantelVisible = true;
    this.mostrarFormPartido = false;

    this.busquedaJugadorTexto = '';
    this.jugadorSeleccionadoId = null;
    this.busquedaStaffTexto = '';
    this.staffSeleccionadoId = null;

    this.cargarPlantel(cat.id);
    this.cargarJugadoresDisponibles(cat.id);
    this.cargarStaff(cat.id);
    this.cargarStaffDisponibles(cat.id);
    this.cargarPartidos(cat.id);
  }

  cargarPlantel(idCategoria: number): void {
    this.cargandoPlantel = true;
    this.http.get<JugadorCategoria[]>(`http://localhost:5191/api/categorias/${idCategoria}/jugadores`).subscribe({
      next: (data) => {
        this.cargandoPlantel = false;
        this.jugadoresPlantel = data.map(j => ({ ...j, minutosJugados: 90 }));
      },
      error: () => this.cargandoPlantel = false
    });
  }

  cargarJugadoresDisponibles(idCategoria: number, query: string = ''): void {
    const q = encodeURIComponent(query.trim());
    this.http.get<JugadorCategoria[]>(`http://localhost:5191/api/categorias/${idCategoria}/jugadores-disponibles?q=${q}`).subscribe({
      next: (data) => {
        this.jugadoresDisponibles = data;
        if (data.length === 1 && query.trim().length > 0) {
          this.jugadorSeleccionadoId = data[0].idJugador;
        } else if (!data.some(j => j.idJugador === this.jugadorSeleccionadoId)) {
          this.jugadorSeleccionadoId = null;
        }
      }
    });
  }

  onBuscarJugadores(): void {
    if (!this.categoriaActiva) return;
    clearTimeout(this.debounceJugadorTimer);
    this.debounceJugadorTimer = setTimeout(() => {
      this.cargarJugadoresDisponibles(this.categoriaActiva!.id, this.busquedaJugadorTexto);
    }, 250);
  }

  limpiarBusquedaJugadores(): void {
    this.busquedaJugadorTexto = '';
    if (this.categoriaActiva) {
      this.cargarJugadoresDisponibles(this.categoriaActiva.id, '');
    }
  }

  agregarJugador(): void {
    if (!this.categoriaActiva || !this.jugadorSeleccionadoId) {
      alert('Seleccione un jugador para agregar a la categoría.');
      return;
    }

    this.http.post(`http://localhost:5191/api/categorias/${this.categoriaActiva.id}/jugadores`, {
      idJugador: this.jugadorSeleccionadoId
    }).subscribe({
      next: () => {
        this.jugadorSeleccionadoId = null;
        this.cargarPlantel(this.categoriaActiva!.id);
        this.cargarJugadoresDisponibles(this.categoriaActiva!.id, this.busquedaJugadorTexto);
        this.cargarDatos();
      },
      error: (err) => alert('Error al asignar jugador: ' + (err.error?.message || 'Error del servidor'))
    });
  }

  quitarJugador(idJugador: number): void {
    if (!this.categoriaActiva) return;
    if (!confirm('¿Desea desvincular al jugador de esta categoría?')) return;

    this.http.delete(`http://localhost:5191/api/categorias/${this.categoriaActiva.id}/jugadores/${idJugador}`).subscribe({
      next: () => {
        this.cargarPlantel(this.categoriaActiva!.id);
        this.cargarJugadoresDisponibles(this.categoriaActiva!.id, this.busquedaJugadorTexto);
        this.cargarDatos();
      },
      error: (err) => alert('Error al desvincular jugador: ' + (err.error?.message || 'Error del servidor'))
    });
  }

  cargarStaff(idCategoria: number): void {
    this.cargandoStaff = true;
    this.http.get<StaffCategoria[]>(`http://localhost:5191/api/categorias/${idCategoria}/staff`).subscribe({
      next: (data) => {
        this.cargandoStaff = false;
        this.staffPlantel = data;
      },
      error: () => this.cargandoStaff = false
    });
  }

  cargarStaffDisponibles(idCategoria: number, query: string = ''): void {
    const q = encodeURIComponent(query.trim());
    this.http.get<StaffCategoria[]>(`http://localhost:5191/api/categorias/${idCategoria}/staff-disponibles?q=${q}`).subscribe({
      next: (data) => {
        this.staffDisponibles = data;
        if (data.length === 1 && query.trim().length > 0) {
          this.staffSeleccionadoId = data[0].idStaff;
        } else if (!data.some(s => s.idStaff === this.staffSeleccionadoId)) {
          this.staffSeleccionadoId = null;
        }
      }
    });
  }

  onBuscarStaff(): void {
    if (!this.categoriaActiva) return;
    clearTimeout(this.debounceStaffTimer);
    this.debounceStaffTimer = setTimeout(() => {
      this.cargarStaffDisponibles(this.categoriaActiva!.id, this.busquedaStaffTexto);
    }, 250);
  }

  limpiarBusquedaStaff(): void {
    this.busquedaStaffTexto = '';
    if (this.categoriaActiva) {
      this.cargarStaffDisponibles(this.categoriaActiva.id, '');
    }
  }

  agregarStaff(): void {
    if (!this.categoriaActiva || !this.staffSeleccionadoId) {
      alert('Seleccione un Director Técnico o Preparador Físico para asignar.');
      return;
    }

    this.http.post(`http://localhost:5191/api/categorias/${this.categoriaActiva.id}/staff`, {
      idStaff: this.staffSeleccionadoId
    }).subscribe({
      next: () => {
        this.staffSeleccionadoId = null;
        this.cargarStaff(this.categoriaActiva!.id);
        this.cargarStaffDisponibles(this.categoriaActiva!.id, this.busquedaStaffTexto);
        this.cargarDatos();
      },
      error: (err) => alert('Error al asignar miembro del staff: ' + (err.error?.message || 'Error del servidor'))
    });
  }

  quitarStaff(idStaff: number): void {
    if (!this.categoriaActiva) return;
    if (!confirm('¿Desea desvincular a este colaborador del cuerpo técnico de esta categoría?')) return;

    this.http.delete(`http://localhost:5191/api/categorias/${this.categoriaActiva.id}/staff/${idStaff}`).subscribe({
      next: () => {
        this.cargarStaff(this.categoriaActiva!.id);
        this.cargarStaffDisponibles(this.categoriaActiva!.id, this.busquedaStaffTexto);
        this.cargarDatos();
      },
      error: (err) => alert('Error al desvincular staff: ' + (err.error?.message || 'Error del servidor'))
    });
  }

  cargarPartidos(idCategoria: number): void {
    this.cargandoPartidos = true;
    this.http.get<any[]>(`http://localhost:5191/api/categorias/${idCategoria}/partidos`).subscribe({
      next: (data) => {
        this.cargandoPartidos = false;
        this.partidosCategoria = data.map(p => {
          const d = new Date(p.fecha);
          return {
            idPartido: p.idPartido,
            fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            rival: p.rival,
            condicion: p.condicion || 'Local',
            resultado: p.resultado
          };
        });
      },
      error: () => this.cargandoPartidos = false
    });
  }

  abrirNuevoPartido(): void {
    this.mostrarFormPartido = true;
    const hoy = new Date().toISOString().split('T')[0];
    this.tipoResultadoSeleccionado = 'G';
    this.marcadorResultado = '';
    this.partidoForm = {
      fechaPartido: hoy,
      rival: '',
      condicionLocalia: 'Local',
      resultado: '',
      observaciones: ''
    };
    this.jugadoresPlantel.forEach(j => j.minutosJugados = 90);
  }

  cancelarNuevoPartido(): void {
    this.mostrarFormPartido = false;
  }

  guardarPartido(): void {
    if (!this.categoriaActiva) return;

    if (!this.partidoForm.fechaPartido || !this.partidoForm.rival.trim() || !this.marcadorResultado.trim()) {
      alert('Complete la fecha, el rival y el marcador del partido (ej. 2-1).');
      return;
    }

    const resultadoFinal = `${this.tipoResultadoSeleccionado} ${this.marcadorResultado.trim()}`.trim();

    const payload = {
      fechaPartido: this.partidoForm.fechaPartido,
      rival: this.partidoForm.rival.trim(),
      condicionLocalia: this.partidoForm.condicionLocalia,
      resultado: resultadoFinal,
      observaciones: this.partidoForm.observaciones.trim() || null,
      jugadoresMinutos: this.jugadoresPlantel.map(j => ({
        idJugador: j.idJugador,
        minutosJugados: Number(j.minutosJugados) || 0
      }))
    };

    this.guardandoPartido = true;
    this.http.post(`http://localhost:5191/api/categorias/${this.categoriaActiva.id}/partidos`, payload).subscribe({
      next: () => {
        this.guardandoPartido = false;
        this.mostrarFormPartido = false;
        this.cargarPartidos(this.categoriaActiva!.id);
      },
      error: (err) => {
        this.guardandoPartido = false;
        alert('Error al registrar el partido: ' + (err.error?.message || 'Error del servidor'));
      }
    });
  }

  irAPartidosCategoria(): void {
    if (!this.categoriaActiva) return;
    const idCat = this.categoriaActiva.id;
    this.cerrarModalPlantel();
    this.router.navigate(['/admin/categorias', idCat, 'partidos']);
  }

  cerrarModalPlantel(): void {
    this.modalPlantelVisible = false;
    this.categoriaActiva = null;
    this.tabActivaModal = 'jugadores';
    this.mostrarFormPartido = false;
  }

  toggleMenuUsuario(event: MouseEvent): void {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }

  toggleSidebar(): void {
    this.sidebarOculto = !this.sidebarOculto;
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
