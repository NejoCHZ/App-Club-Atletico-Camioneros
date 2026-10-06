import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

export interface TutorInfo {
  dni?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  parentesco?: string;
}

export interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  posicionCancha: string;
  fechaNacimiento: string;
  estadoCuota: 'AL DÍA' | 'PENDIENTE' | 'ADEUDA' | string;
  tutor?: TutorInfo | null;
}

export interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
}

@Component({
  selector: 'app-admin-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-jugadores.html',
  styleUrl: './admin-lista-jugadores.css'
})
export class AdminListaJugadores implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  categoriaFiltro = '';
  posicionFiltro = '';
  ordenFiltro = '';
  activeTab = 'Jugadores';

  menuUsuarioAbierto = false;
  sidebarOculto = false;

  // Modales
  modalEliminarVisible = false;
  jugadorAEliminar: Player | null = null;
  eliminando = false;

  modalTutorVisible = false;
  jugadorTutor: Player | null = null;
  tutorForm: TutorInfo = {
    dni: '',
    nombre: '',
    apellido: '',
    parentesco: 'Padre',
    telefono: '',
    email: ''
  };
  buscandoTutor = false;
  tutorEncontradoMensaje = '';
  guardandoTutor = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  players: Player[] = [];
  listaCategorias: Categoria[] = [];

  posicionesDisponibles: string[] = [
    'Arquero',
    'Defensor',
    'Mediocampista',
    'Delantero'
  ];

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarJugadores();
    this.cargarCategorias();
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
        const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email || '';

        this.usuarioActual = {
          nombre: this.limpiarNombreRol(rol),
          email: email
        };
      } catch {
        this.usuarioActual = { nombre: this.limpiarNombreRol(rol), email: '' };
      }
    }
  }

  formatearPosicion(pos?: string): string {
    if (!pos) return 'Sin definir';
    const p = pos.trim().toUpperCase();
    if (p.includes('ARQUER')) return 'Arquero';
    if (p.includes('DEFENS')) return 'Defensor';
    if (p.includes('MEDIO') || p.includes('VOLANTE')) return 'Mediocampista';
    if (p.includes('DELANT')) return 'Delantero';
    return pos.trim();
  }

  cargarJugadores(): void {
    this.http.get<any[]>('http://localhost:5191/api/jugadores').subscribe({
      next: (data) => {
        this.players = data.map(j => {
          let fechaFormateada = 'Sin informar';
          if (j.fechaDeNacimiento) {
            const date = new Date(j.fechaDeNacimiento);
            fechaFormateada = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }

          const t = j.tutor || j.Tutor;
          return {
            id: j.idJugador,
            nombreCompleto: `${j.nombre} ${j.apellido}`.trim(),
            dni: j.dni,
            categoria: j.nombreCategoria || 'Sin categoría',
            posicionCancha: this.formatearPosicion(j.posicionCancha || j.posicion),
            fechaNacimiento: fechaFormateada,
            estadoCuota: j.estadoCuota || 'AL DÍA',
            tutor: t ? {
              dni: t.dni || t.Dni || '',
              nombre: t.nombre || t.Nombre || '',
              apellido: t.apellido || t.Apellido || '',
              telefono: t.telefono || t.Telefono || '',
              email: t.email || t.Email || '',
              parentesco: t.parentesco || t.Parentesco || ''
            } : null
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar la lista de jugadores', err);
      }
    });
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.listaCategorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
      }
    });
  }

  getCategoriasList(categoriaStr: string): string[] {
    if (!categoriaStr) return ['Sin categoría'];
    return categoriaStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  get filteredPlayers(): Player[] {
    return this.players
      .filter(p => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term ||
          p.nombreCompleto.toLowerCase().includes(term) ||
          p.dni.includes(term);

        const matchCat = !this.categoriaFiltro ||
          this.getCategoriasList(p.categoria).some(c => c.toUpperCase() === this.categoriaFiltro.toUpperCase());

        const matchPos = !this.posicionFiltro ||
          p.posicionCancha.toUpperCase() === this.posicionFiltro.toUpperCase();

        return matchSearch && matchCat && matchPos;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCompleto.localeCompare(b.nombreCompleto);
        if (this.ordenFiltro === 'dni') return a.dni.localeCompare(b.dni);
        if (this.ordenFiltro === 'categoria') return a.categoria.localeCompare(b.categoria);
        if (this.ordenFiltro === 'posicion') return a.posicionCancha.localeCompare(b.posicionCancha);
        return 0;
      });
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

  irAAltaJugador(): void {
    this.router.navigate(['/admin/alta-jugador']);
  }

  irASeleccionPortales(): void {
    this.router.navigate(['/seleccion-portales']);
  }

  irAConfiguracion(): void {
    alert('Módulo de configuración de cuenta en desarrollo.');
  }

  selectNav(label: string): void {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Inicio') this.router.navigate(['/admin']);
    else if (label === 'Jugadores') this.router.navigate(['/admin/lista-jugadores']);
    else if (label === 'Categorias' || label === 'Categorías') this.router.navigate(['/admin/categorias']);
    else if (label === 'Staff') this.router.navigate(['/admin/staff']);
  }

  verFicha(id: number): void {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarPerfil(id: number): void {
    this.router.navigate(['/admin/editar-perfil', id]);
  }

  abrirModalEliminar(player: Player): void {
    this.jugadorAEliminar = player;
    this.modalEliminarVisible = true;
  }

  cancelarEliminar(): void {
    this.modalEliminarVisible = false;
    this.jugadorAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.jugadorAEliminar) return;

    this.eliminando = true;
    const id = this.jugadorAEliminar.id;

    this.http.delete(`http://localhost:5191/api/jugadores/${id}`).subscribe({
      next: () => {
        this.players = this.players.filter(p => p.id !== id);
        this.eliminando = false;
        this.modalEliminarVisible = false;
        this.jugadorAEliminar = null;
      },
      error: (err) => {
        this.eliminando = false;
        alert('Error al eliminar el jugador: ' + (err.error?.message || 'Error del servidor'));
      }
    });
  }

  // --- Modal Tutor con DNI y Búsqueda Reutilizable ---
  abrirModalTutor(player: Player): void {
    this.jugadorTutor = player;
    this.tutorEncontradoMensaje = '';
    if (player.tutor) {
      this.tutorForm = {
        dni: player.tutor.dni || '',
        nombre: player.tutor.nombre || '',
        apellido: player.tutor.apellido || '',
        parentesco: player.tutor.parentesco || 'Padre',
        telefono: player.tutor.telefono || '',
        email: player.tutor.email || ''
      };
    } else {
      this.tutorForm = {
        dni: '',
        nombre: '',
        apellido: '',
        parentesco: 'Padre',
        telefono: '',
        email: ''
      };
    }
    this.modalTutorVisible = true;
  }

  cancelarTutor(): void {
    this.modalTutorVisible = false;
    this.jugadorTutor = null;
    this.tutorEncontradoMensaje = '';
  }

  buscarTutorModal(): void {
    const dni = (this.tutorForm.dni || '').trim();
    if (!dni) {
      alert('Por favor ingrese el DNI del tutor para realizar la búsqueda.');
      return;
    }

    this.buscandoTutor = true;
    this.tutorEncontradoMensaje = '';

    this.http.get<any>(`http://localhost:5191/api/jugadores/tutores/${dni}`).subscribe({
      next: (data) => {
        this.buscandoTutor = false;
        this.tutorForm.nombre = data.nombre || '';
        this.tutorForm.apellido = data.apellido || '';
        this.tutorForm.telefono = data.telefono || '';
        this.tutorForm.email = data.email || '';
        if (data.parentesco) {
          this.tutorForm.parentesco = data.parentesco;
        }
        this.tutorEncontradoMensaje = `Tutor existente encontrado: ${data.nombre} ${data.apellido}. Datos autocompletados.`;
      },
      error: () => {
        this.buscandoTutor = false;
        this.tutorEncontradoMensaje = '';
        alert('No se encontró ningún tutor previamente registrado con ese DNI. Puede completar los datos manualmente para darlo de alta.');
      }
    });
  }

  guardarTutor(): void {
    if (!this.jugadorTutor) return;

    if (!this.tutorForm.dni?.trim() || !this.tutorForm.nombre?.trim() || !this.tutorForm.apellido?.trim() || !this.tutorForm.telefono?.trim()) {
      alert('DNI, nombre, apellido y teléfono del tutor son obligatorios.');
      return;
    }

    this.guardandoTutor = true;
    const id = this.jugadorTutor.id;

    this.http.put(`http://localhost:5191/api/jugadores/${id}/tutor`, this.tutorForm).subscribe({
      next: () => {
        if (this.jugadorTutor) {
          this.jugadorTutor.tutor = { ...this.tutorForm };
        }
        this.guardandoTutor = false;
        this.modalTutorVisible = false;
        this.jugadorTutor = null;
        this.cargarJugadores();
      },
      error: (err) => {
        this.guardandoTutor = false;
        alert('Error al guardar tutor: ' + (err.error?.message || 'Error del servidor'));
      }
    });
  }

  getBadgeClass(estado: Player['estadoCuota']): string {
    const e = (estado || '').toUpperCase();
    if (e.includes('AL DÍA') || e.includes('AL DIA')) return 'badge-aldia';
    if (e.includes('PENDIENTE')) return 'badge-pendiente';
    if (e.includes('ADEUDA') || e.includes('INHABILITADO')) return 'badge-adeuda';
    return '';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
