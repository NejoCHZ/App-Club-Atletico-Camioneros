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
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  searchTerm = '';
  rolFiltro = '';
  ordenFiltro = '';
  activeTab = 'Staff';

  menuUsuarioAbierto = false;
  sidebarOculto = false;

  // Matriz de los 7 roles sin aclaraciones parentéticas
  rolesDisponibles: string[] = [
    'Administrador',
    'Administrativo',
    'Médico',
    'Director Técnico',
    'Don QR',
    'Preparador Físico',
    'Coordinador'
  ];

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

  // Sanitizador para mostrar "Administrador" en lugar de "Administrador (Tesorero)" o "Tesorero"
  limpiarNombreRol(rol: string): string {
    if (!rol) return '';
    let r = rol.replace(/\s*\([^)]*\)/gi, '').trim();
    if (r.toLowerCase() === 'tesorero') {
      r = 'Administrador';
    }
    return r;
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
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

  private cargarStaff(): void {
    this.http.get<any[]>('http://localhost:5191/api/staff').subscribe({
      next: (data) => {
        this.trabajadores = data.map(s => {
          let edadTexto = 'Sin edad';
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

          const rolLimpio = this.limpiarNombreRol(s.rol || 'STAFF');

          return {
            id: s.idStaff || s.id,
            nombreCompleto: (s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`).trim().toUpperCase(),
            dni: s.dni || '-',
            rol: rolLimpio.toUpperCase(),
            edad: edadTexto,
            categoriaAsignada: s.categoriaAsignada || 'Todas / General',
            telefono: s.telefono || '-',
            estado: s.activo !== undefined ? (s.activo ? 'ACTIVO' : 'INACTIVO') : 'ACTIVO'
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar la nómina de staff:', err);
      }
    });
  }

  get filteredStaff(): StaffMember[] {
    return this.trabajadores
      .filter(t => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term ||
          t.nombreCompleto.toLowerCase().includes(term) ||
          t.dni.includes(term);

        const matchRol = !this.rolFiltro ||
          this.normalizar(t.rol).includes(this.normalizar(this.rolFiltro));

        return matchSearch && matchRol;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCompleto.localeCompare(b.nombreCompleto);
        if (this.ordenFiltro === 'nombre-desc') return b.nombreCompleto.localeCompare(a.nombreCompleto);
        if (this.ordenFiltro === 'dni') return a.dni.localeCompare(b.dni);
        if (this.ordenFiltro === 'rol') return a.rol.localeCompare(b.rol);
        if (this.ordenFiltro === 'edad') {
          const edadA = parseInt(a.edad, 10) || 0;
          const edadB = parseInt(b.edad, 10) || 0;
          return edadB - edadA;
        }
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

  darDeAltaTrabajador(): void {
    this.router.navigate(['/admin/alta-trabajador']);
  }

  editarTrabajador(id: number): void {
    this.router.navigate(['/admin/staff/editar-ficha', id]);
  }

  verFicha(id: number): void {
    this.router.navigate(['/admin/staff/ver-ficha', id]);
  }
}
