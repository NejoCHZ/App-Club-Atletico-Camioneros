import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

interface TutorInfo {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  parentesco?: string;
}

interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  fechaNacimiento: string;
  estadoCuota: 'AL DÍA' | 'PENDIENTE' | 'ADEUDA' | 'INHABILITADO' | string;
  tutor?: TutorInfo | null;
}

interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  categoriaFiltro = '';
  ordenFiltro = '';
  activeTab = 'Inicio';

  menuUsuarioAbierto = false;
  sidebarOculto = false;

  tutorModalVisible = false;
  jugadorConTutor: Player | null = null;

  navItems = [
    { label: 'Inicio', icon: 'home', active: true },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  kpiCards = [
    { title: 'Jugadores Registrados', value: '...', type: 'jugadores' },
    { title: 'Categorías Activas', value: '...', type: 'categorias' },
    { title: 'Cuotas al Día', value: '...', type: 'cuotas' }
  ];

  players: Player[] = [];
  listaCategorias: Categoria[] = [];

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDatos();
    this.cargarCategoriasBd();
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

  private cargarDatos(): void {
    this.http.get<any[]>('http://localhost:5191/api/jugadores').subscribe({
      next: (data) => {
        this.players = data.map(j => {
          let fechaFormateada = 'Sin informar';
          if (j.fechaDeNacimiento) {
            const date = new Date(j.fechaDeNacimiento);
            fechaFormateada = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }

          return {
            id: j.idJugador,
            nombreCompleto: `${j.nombre} ${j.apellido}`.trim(),
            dni: j.dni,
            categoria: j.nombreCategoria || 'Sin categoría',
            fechaNacimiento: fechaFormateada,
            estadoCuota: j.estadoCuota || 'AL DÍA',
            tutor: j.tutor || j.Tutor || null
          };
        });

        const alDia = this.players.filter(p => p.estadoCuota === 'AL DÍA').length;
        this.kpiCards[0].value = `+${this.players.length}`;
        this.kpiCards[2].value = `${alDia}/${this.players.length}`;
      },
      error: (err) => {
        console.error('Error al cargar jugadores', err);
        this.kpiCards[0].value = '0';
        this.kpiCards[2].value = '0';
      }
    });
  }

  private cargarCategoriasBd(): void {
    this.http.get<Categoria[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.listaCategorias = data;
        this.kpiCards[1].value = `+${data.length}`;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
        this.kpiCards[1].value = '0';
      }
    });
  }

  private getPrioridadEstadoCuota(estado: string): number {
    const e = (estado || '').trim().toUpperCase();
    if (e.includes('INHABILITADO') || e.includes('ADEUDA')) return 1;
    if (e.includes('PENDIENTE')) return 2;
    if (e.includes('AL DÍA') || e.includes('AL DIA')) return 3;
    return 4;
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

        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCompleto.localeCompare(b.nombreCompleto);
        if (this.ordenFiltro === 'dni') return a.dni.localeCompare(b.dni);
        if (this.ordenFiltro === 'categoria') return a.categoria.localeCompare(b.categoria);
        if (this.ordenFiltro === 'cuota') {
          const pesoA = this.getPrioridadEstadoCuota(a.estadoCuota);
          const pesoB = this.getPrioridadEstadoCuota(b.estadoCuota);
          if (pesoA !== pesoB) return pesoA - pesoB;
          return a.nombreCompleto.localeCompare(b.nombreCompleto);
        }
        return 0;
      });
  }

  tieneTutor(player: Player): boolean {
    if (!player.tutor) return false;
    const t = player.tutor;
    return !!((t.nombre && t.nombre.trim() !== '' && t.nombre !== 'Sin informar') ||
      (t.apellido && t.apellido.trim() !== ''));
  }

  verTutor(player: Player): void {
    if (!this.tieneTutor(player)) return;
    this.jugadorConTutor = player;
    this.tutorModalVisible = true;
  }

  cerrarModalTutor(): void {
    this.tutorModalVisible = false;
    this.jugadorConTutor = null;
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

  selectNav(label: string): void {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Jugadores') this.router.navigate(['/admin/lista-jugadores']);
    else if (label === 'Inicio') this.router.navigate(['/admin']);
    else if (label === 'Categorias' || label === 'Categorías') this.router.navigate(['/admin/categorias']);
    else if (label === 'Staff') this.router.navigate(['/admin/staff']);
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
