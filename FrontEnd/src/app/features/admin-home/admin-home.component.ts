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
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
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
  activeTab = 'Inicio';

  // Estados interactivos solicitados
  menuUsuarioAbierto = false;
  sidebarOculto = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: true },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  kpiCards = [
    { title: 'Jugadores Activos', value: '...', type: 'jugadores', icon: 'group' },
    { title: 'Categorias Activas', value: '...', type: 'categorias', icon: 'flag' }
  ];

  players: Player[] = [];
  listaCategorias: Categoria[] = [];

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDatos();
    this.cargarCategoriasBd();
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

  private cargarDatos() {
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
        this.kpiCards[0].value = `+${this.players.length}`;
      },
      error: (err) => {
        console.error('Error al cargar jugadores', err);
        this.kpiCards[0].value = '0';
      }
    });
  }

  private cargarCategoriasBd() {
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

  // Interacciones de UI solicitadas
  toggleMenuUsuario(event: Event) {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }

  toggleSidebar() {
    this.sidebarOculto = !this.sidebarOculto;
  }

  // Ocultar menú flotante al hacer clic fuera
  @HostListener('document:click')
  cerrarMenus() {
    this.menuUsuarioAbierto = false;
  }

  irAAltaJugador() {
    this.router.navigate(['/admin/alta-jugador']);
  }

  irASeleccionPortales() {
    this.router.navigate(['/seleccion-portales']);
  }

  irAConfiguracion() {
    // Ajustar ruta de configuración cuando esté creada
    alert('Módulo de configuración de cuenta en desarrollo.');
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Inicio') {
      this.router.navigate(['/admin']);
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
