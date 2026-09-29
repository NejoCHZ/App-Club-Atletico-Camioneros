import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  fechaNacimiento: string;
  estadoCuota: 'AL DÍA' | 'PENDIENTE' | 'ADEUDA' | string;
}

interface Categoria {
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
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  categoriaFiltro = '';
  ordenFiltro = '';
  activeTab = 'Jugadores';

  // Estados interactivos estandarizados
  menuUsuarioAbierto = false;
  sidebarOculto = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  players: Player[] = [];
  listaCategorias: Categoria[] = [];

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarJugadores();
    this.cargarCategorias();
  }

  private cargarUsuario() {
    const token = this.authService.getToken();
    const rol = this.authService.getRol() || 'Tesorero';

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email || '';

        this.usuarioActual = {
          nombre: rol,
          email: email
        };
      } catch (e) {
        this.usuarioActual = { nombre: rol, email: '' };
      }
    }
  }

  private cargarJugadores() {
    this.http.get<any[]>('http://localhost:5191/api/jugadores').subscribe({
      next: (data) => {
        this.players = data.map(j => {
          let fechaFormateada = 'N/A';
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
            estadoCuota: j.estadoCuota || 'AL DÍA'
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar la lista de jugadores', err);
      }
    });
  }

  private cargarCategorias() {
    this.http.get<Categoria[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.listaCategorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
      }
    });
  }

  get filteredPlayers(): Player[] {
    return this.players
      .filter(p => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term ||
          p.nombreCompleto.toLowerCase().includes(term) ||
          p.dni.includes(term);
        const matchCat = !this.categoriaFiltro || p.categoria.toUpperCase() === this.categoriaFiltro.toUpperCase();
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCompleto.localeCompare(b.nombreCompleto);
        if (this.ordenFiltro === 'dni') return a.dni.localeCompare(b.dni);
        if (this.ordenFiltro === 'categoria') return a.categoria.localeCompare(b.categoria);
        return 0;
      });
  }

  // Control UI: Sidebar y Menú Usuario
  toggleMenuUsuario(event: MouseEvent) {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }

  toggleSidebar() {
    this.sidebarOculto = !this.sidebarOculto;
  }

  @HostListener('document:click')
  cerrarMenus() {
    this.menuUsuarioAbierto = false;
  }

  // Navegación
  irAAltaJugador() {
    this.router.navigate(['/admin/alta-jugador']);
  }

  irASeleccionPortales() {
    this.router.navigate(['/seleccion-portales']);
  }

  irAConfiguracion() {
    alert('Módulo de configuración de cuenta en desarrollo.');
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Inicio') {
      this.router.navigate(['/admin']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    }
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarPerfil(id: number) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }

  getBadgeClass(estado: Player['estadoCuota']): string {
    switch (estado) {
      case 'AL DÍA': return 'badge-aldia';
      case 'PENDIENTE': return 'badge-pendiente';
      case 'ADEUDA': return 'badge-adeuda';
      default: return '';
    }
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
