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
  asociacion: string;
}

@Component({
  selector: 'app-admin-lista-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-categoria.html',
  styleUrl: './admin-lista-categoria.css',
})
export class AdminListaCategoria implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';
  activeTab = 'Categorias';

  // Control interactivo del Layout
  menuUsuarioAbierto = false;
  sidebarOculto = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: true }
  ];

  categorias: CategoriaItem[] = [];

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDatos();
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
    // 1. Obtenemos las categorías reales de la base de datos
    this.http.get<any[]>('http://localhost:5191/api/categorias').subscribe({
      next: (cats) => {
        // 2. Consultamos jugadores para calcular la cantidad real por categoría
        this.http.get<any[]>('http://localhost:5191/api/jugadores').subscribe({
          next: (players) => {
            this.mapearCategorias(cats, players);
          },
          error: () => {
            this.mapearCategorias(cats, []);
          }
        });
      },
      error: (err) => console.error('Error al cargar categorías desde la API', err)
    });
  }

  private mapearCategorias(cats: any[], players: any[]) {
    this.categorias = cats.map(c => {
      const count = players.filter(p => p.idCategoria === c.idCategoria).length;
      const esAfa = (c.nombreCategoria || '').toUpperCase().includes('AFA');

      return {
        id: c.idCategoria,
        nombre: c.nombreCategoria,
        cantidadJugadores: `${count} JUGADORES`,
        asociacion: esAfa ? 'AFA' : 'Liga Cordobesa'
      };
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

  // Interacción de UI estandarizada
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

  irASeleccionPortales() {
    this.router.navigate(['/seleccion-portales']);
  }

  irAConfiguracion() {
    alert('Módulo de configuración de cuenta en desarrollo.');
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
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

  verCategoria(id: number) {
    this.router.navigate(['/admin/categoria', id, 'jugadores']);
  }
}
