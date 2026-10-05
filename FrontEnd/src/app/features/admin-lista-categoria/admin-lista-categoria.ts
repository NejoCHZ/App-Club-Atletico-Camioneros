import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

export interface CategoriaItem {
  id: number;
  nombre: string;
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
}

export interface StaffCategoria {
  idStaff: number;
  nombreCompleto: string;
  dni: string;
  rol: string;
  email: string;
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

  // Modal de Confirmación de Eliminación
  modalEliminarVisible = false;
  categoriaAEliminar: CategoriaItem | null = null;
  eliminando = false;

  // Modal de Detalle (Jugadores + Cuerpo Técnico)
  modalPlantelVisible = false;
  categoriaActiva: CategoriaItem | null = null;
  tabActivaModal: 'jugadores' | 'staff' = 'jugadores';

  // Submódulo: Jugadores con buscador reactivo
  jugadoresPlantel: JugadorCategoria[] = [];
  jugadoresDisponibles: JugadorCategoria[] = [];
  busquedaJugadorTexto = '';
  jugadorSeleccionadoId: number | null = null;
  cargandoPlantel = false;
  private debounceJugadorTimer: any;

  // Submódulo: Cuerpo Técnico (DT y PF) con buscador reactivo
  staffPlantel: StaffCategoria[] = [];
  staffDisponibles: StaffCategoria[] = [];
  busquedaStaffTexto = '';
  staffSeleccionadoId: number | null = null;
  cargandoStaff = false;
  private debounceStaffTimer: any;

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
          const esAfa = (c.nombreCategoria || '').toUpperCase().includes('AFA');
          return {
            id: c.idCategoria,
            nombre: c.nombreCategoria,
            cantidadJugadores: `${c.cantidadJugadores || 0} JUGADORES`,
            cantidadStaff: `${c.cantidadStaff || 0} CUERPO TÉCNICO`,
            asociacion: esAfa ? 'AFA' : 'Liga Cordobesa'
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
        const matchAso = !this.asociacionFiltro || c.asociacion === this.asociacionFiltro;
        return matchSearch && matchAso;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombre.localeCompare(b.nombre);
        return 0;
      });
  }

  // --- Crear / Editar Categoría ---
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.categoriaFormId = 0;
    this.categoriaFormNombre = '';
    this.modalCategoriaVisible = true;
  }

  abrirModalEditar(cat: CategoriaItem): void {
    this.modoEdicion = true;
    this.categoriaFormId = cat.id;
    this.categoriaFormNombre = cat.nombre;
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

    if (this.modoEdicion) {
      this.http.put(`http://localhost:5191/api/categorias/${this.categoriaFormId}`, {
        nombreCategoria: this.categoriaFormNombre.trim()
      }).subscribe({
        next: () => {
          this.cerrarModalCategoria();
          this.cargarDatos();
        },
        error: (err) => alert('Error al actualizar la categoría: ' + (err.error?.message || 'Error del servidor'))
      });
    } else {
      this.http.post('http://localhost:5191/api/categorias', {
        nombreCategoria: this.categoriaFormNombre.trim()
      }).subscribe({
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

  // --- Modal de Gestión (Jugadores + Cuerpo Técnico) ---
  verCategoria(cat: CategoriaItem): void {
    this.categoriaActiva = cat;
    this.tabActivaModal = 'jugadores';
    this.modalPlantelVisible = true;

    this.busquedaJugadorTexto = '';
    this.jugadorSeleccionadoId = null;
    this.busquedaStaffTexto = '';
    this.staffSeleccionadoId = null;

    this.cargarPlantel(cat.id);
    this.cargarJugadoresDisponibles(cat.id);
    this.cargarStaff(cat.id);
    this.cargarStaffDisponibles(cat.id);
  }

  cargarPlantel(idCategoria: number): void {
    this.cargandoPlantel = true;
    this.http.get<JugadorCategoria[]>(`http://localhost:5191/api/categorias/${idCategoria}/jugadores`).subscribe({
      next: (data) => {
        this.cargandoPlantel = false;
        this.jugadoresPlantel = data;
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

  cerrarModalPlantel(): void {
    this.modalPlantelVisible = false;
    this.categoriaActiva = null;
    this.tabActivaModal = 'jugadores';
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
