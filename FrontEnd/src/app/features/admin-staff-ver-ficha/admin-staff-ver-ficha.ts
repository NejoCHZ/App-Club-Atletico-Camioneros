import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

export interface StaffFichaDetalle {
  idStaff: number;
  idUsuario: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string;
  fechaDeNacimiento?: string;
  domicilio?: string;
  email: string;
  idRol: number;
  rol: string;
  idCategoriaAsignada?: number | null;
  categoriaAsignada: string;
  activo: boolean;
}

@Component({
  selector: 'app-admin-staff-ver-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-staff-ver-ficha.html',
  styleUrl: './admin-staff-ver-ficha.css'
})
export class AdminStaffVerFicha implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  staffId: number = 0;
  isLoading: boolean = false;
  mostrarPopupCredencial: boolean = false;

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  menuUsuarioAbierto: boolean = false;
  sidebarOculto: boolean = false;
  activeTab: string = 'Staff';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  // Datos del colaborador en visualización
  nombreCompleto: string = 'Cargando...';
  rol: string = '...';
  dni: string = '-';
  fechaNacimiento: string = 'Sin informar';
  edad: string = 'Sin edad';
  domicilio: string = 'Sin registrar';
  email: string = 'Sin registrar';
  categoriaAsignada: string = 'Todas / General';
  activo: boolean = true;

  ngOnInit(): void {
    this.cargarUsuario();

    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.staffId = Number(idParam);
        this.cargarFichaStaff(this.staffId);
      }
    });
  }

  limpiarNombreRol(rolStr: string): string {
    if (!rolStr) return '';
    let r = rolStr.replace(/\s*\([^)]*\)/gi, '').trim();
    if (r.toLowerCase() === 'tesorero') {
      r = 'Administrador';
    }
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

  private cargarFichaStaff(id: number): void {
    this.isLoading = true;
    this.http.get<StaffFichaDetalle>(`http://localhost:5191/api/staff/${id}`).subscribe({
      next: (s) => {
        this.isLoading = false;
        this.nombreCompleto = (s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`).trim().toUpperCase();
        this.rol = this.limpiarNombreRol(s.rol || 'STAFF').toUpperCase();
        this.dni = s.dni || 'Sin DNI';
        this.domicilio = s.domicilio || 'Sin registrar';
        this.email = s.email || 'Sin registrar';
        this.categoriaAsignada = s.categoriaAsignada || 'Todas / General';
        this.activo = s.activo !== undefined ? s.activo : true;

        if (s.fechaDeNacimiento) {
          const birthDate = new Date(s.fechaDeNacimiento);
          const d = String(birthDate.getDate()).padStart(2, '0');
          const m = String(birthDate.getMonth() + 1).padStart(2, '0');
          const y = birthDate.getFullYear();
          this.fechaNacimiento = `${d}/${m}/${y}`;
          this.edad = this.calcularEdad(birthDate);
        } else {
          this.fechaNacimiento = 'Sin informar';
          this.edad = 'Sin edad';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar la ficha del staff:', err);
        alert('No se pudo encontrar al colaborador solicitado.');
        this.volver();
      }
    });
  }

  private calcularEdad(birthDate: Date): string {
    const hoy = new Date();
    let edadNum = hoy.getFullYear() - birthDate.getFullYear();
    const m = hoy.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < birthDate.getDate())) {
      edadNum--;
    }
    return edadNum > 0 ? `${edadNum} AÑOS` : 'Sin edad';
  }

  editarPerfil(): void {
    this.router.navigate(['/admin/staff/editar-ficha', this.staffId]);
  }

  volver(): void {
    this.router.navigate(['/admin/staff']);
  }

  generarCredencial(): void {
    this.mostrarPopupCredencial = true;
  }

  descargarCredencial(): void {
    alert(`Descargando credencial oficial en PDF de ${this.nombreCompleto}...`);
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
    if (label === 'Inicio') {
      this.router.navigate(['/admin']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    }
  }
}
