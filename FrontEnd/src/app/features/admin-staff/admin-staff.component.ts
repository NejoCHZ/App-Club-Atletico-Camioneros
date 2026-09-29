import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

export interface StaffMember {
  id: number;
  nombreCompleto: string;
  dni: string;
  rol: string;
  edad: string;
  categoriaAsignada: string;
  telefono: string;
  estado: 'ACTIVO' | 'LICENCIA' | 'INACTIVO' | string;
}

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-staff.component.html',
  styleUrl: './admin-staff.component.css'
})
export class AdminStaffComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  rolFiltro = '';
  activeTab = 'Staff';

  // Estados interactivos unificados del Layout
  menuUsuarioAbierto = false;
  sidebarOculto = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  trabajadores: StaffMember[] = [];

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarStaff();
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

  private cargarStaff() {
    this.http.get<any[]>('http://localhost:5191/api/staff').subscribe({
      next: (data) => {
        this.trabajadores = data.map(s => {
          let edadTexto = 'N/A';
          if (s.fechaDeNacimiento) {
            const birthDate = new Date(s.fechaDeNacimiento);
            const hoy = new Date();
            let edadCalculada = hoy.getFullYear() - birthDate.getFullYear();
            const m = hoy.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < birthDate.getDate())) {
              edadCalculada--;
            }
            edadTexto = `${edadCalculada} AÑOS`;
          } else if (s.edad) {
            edadTexto = `${s.edad} AÑOS`;
          }

          return {
            id: s.idStaff || s.id,
            nombreCompleto: s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim(),
            dni: s.dni || '',
            rol: (s.rol || 'STAFF').toUpperCase(),
            edad: edadTexto,
            categoriaAsignada: s.categoriaAsignada || 'TODAS',
            telefono: s.telefono || '-',
            estado: s.activo !== undefined ? (s.activo ? 'ACTIVO' : 'INACTIVO') : 'ACTIVO'
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar staff desde la API', err);
      }
    });
  }

  toggleRolFiltro(rol: string) {
    if (this.rolFiltro === rol) {
      this.rolFiltro = '';
    } else {
      this.rolFiltro = rol;
    }
  }

  get filteredStaff(): StaffMember[] {
    return this.trabajadores.filter(t => {
      const term = this.searchTerm.trim().toLowerCase();
      const matchSearch = !term ||
        t.nombreCompleto.toLowerCase().includes(term) ||
        t.dni.includes(term);
      const matchRol = !this.rolFiltro || t.rol.toUpperCase() === this.rolFiltro.toUpperCase();
      return matchSearch && matchRol;
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

  darDeAltaTrabajador() {
    this.router.navigate(['/admin/alta-trabajador']);
  }

  editarTrabajador(id: number) {
    this.router.navigate(['/admin/staff/editar-ficha', id]);
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/staff/ver-ficha', id]);
  }
}
