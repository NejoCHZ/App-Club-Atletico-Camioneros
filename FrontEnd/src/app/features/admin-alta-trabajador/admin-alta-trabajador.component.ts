import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

export interface CategoriaSimple {
  idCategoria: number;
  nombreCategoria: string;
}

@Component({
  selector: 'app-admin-alta-trabajador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-alta-trabajador.component.html',
  styleUrl: './admin-alta-trabajador.component.css'
})
export class AdminAltaTrabajadorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  menuUsuarioAbierto = false;
  sidebarOculto = false;
  mostrarPopupCredencial = false;
  mensajeExito = false;
  isLoading = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  // Matriz Oficial de 7 Roles del CACC
  rolesDisponibles = [
    { valor: 'ADMINISTRADOR', texto: 'Administrador' },
    { valor: 'ADMINISTRATIVO', texto: 'Administrativo' },
    { valor: 'MÉDICO', texto: 'Médico' },
    { valor: 'DIRECTOR TÉCNICO', texto: 'Director Técnico' },
    { valor: 'DON QR', texto: 'Don QR' },
    { valor: 'PREPARADOR FÍSICO', texto: 'Preparador Físico' },
    { valor: 'COORDINADOR', texto: 'Coordinador' }
  ];

  listaCategorias: CategoriaSimple[] = [];
  categoriaSeleccionadaId: number | null = null;

  // Datos del colaborador
  dni = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  rol = '';

  // Contacto y Seguridad
  telefono = '';
  email = '';
  password = '';
  repeatPassword = '';
  domicilio = '';
  contactoEmergencia = '';
  patologias = '';
  observacionesMedicas = '';

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarCategorias();
  }

  limpiarNombreRol(rol: string): string {
    if (!rol) return '';
    let r = rol.replace(/\s*\([^)]*\)/gi, '').trim();
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

  private cargarCategorias(): void {
    this.http.get<any[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.listaCategorias = data.map(c => ({
          idCategoria: c.idCategoria || c.PK_id_categoria,
          nombreCategoria: c.nombreCategoria || c.nombre_categoria
        }));
      },
      error: (err) => {
        console.error('Error al obtener categorías deportivas:', err);
      }
    });
  }

  requiereCategoria(): boolean {
    const r = (this.rol || '').toUpperCase();
    return r === 'DIRECTOR TÉCNICO' || r === 'PREPARADOR FÍSICO';
  }

  onRolChange(): void {
    if (!this.requiereCategoria()) {
      this.categoriaSeleccionadaId = null;
    }
  }

  onFechaNacimientoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputEvent = event as InputEvent;

    let raw = input.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);

    let formatted = '';
    if (raw.length > 0) formatted = raw.substring(0, 2);
    if (raw.length > 2) formatted += '/' + raw.substring(2, 4);
    if (raw.length > 4) formatted += '/' + raw.substring(4, 8);

    if (inputEvent && inputEvent.inputType === 'deleteContentBackward') {
      if (input.value.endsWith('/')) {
        formatted = input.value.slice(0, -1);
      }
    }

    this.fechaNacimiento = formatted;
    input.value = formatted;
  }

  guardarYGenerarQR(): void {
    if (!this.dni || !this.nombre || !this.apellido || !this.fechaNacimiento || !this.rol) {
      alert('Por favor complete los campos obligatorios (*) de los Datos del Empleado.');
      return;
    }

    if (this.requiereCategoria() && !this.categoriaSeleccionadaId) {
      alert('Debe asignar una categoría deportiva obligatoria para el Director Técnico o Preparador Físico.');
      return;
    }

    if (!this.telefono || !this.email || !this.password || !this.domicilio) {
      alert('Por favor complete los campos obligatorios (*) de Contacto y Seguridad.');
      return;
    }

    if (this.password !== this.repeatPassword) {
      alert('Las contraseñas ingresadas no coinciden.');
      return;
    }

    let fechaIso: string | null = null;
    if (this.fechaNacimiento && this.fechaNacimiento.length === 10) {
      const parts = this.fechaNacimiento.split('/');
      if (parts.length === 3) {
        fechaIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const payload = {
      dni: this.dni.replace(/\./g, '').trim(),
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      fechaNacimiento: fechaIso,
      genero: 'No especificado',
      domicilio: this.domicilio.trim(),
      telefono: this.telefono.trim(),
      email: this.email.trim(),
      contrasenia: this.password,
      rol: this.rol,
      idCategoria: this.categoriaSeleccionadaId
    };

    this.isLoading = true;
    this.http.post<any>('http://localhost:5191/api/staff', payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.mensajeExito = true;
        this.mostrarPopupCredencial = true;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 409) {
          alert('Conflicto: Ya existe una persona o usuario registrado con ese DNI o Email en el club.');
        } else {
          alert('Error al registrar el personal: ' + (err.error?.message || 'Error del servidor.'));
        }
      }
    });
  }

  descargarCredencial(): void {
    alert('Descargando credencial oficial en formato PDF...');
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

  volver(): void {
    this.router.navigate(['/admin/staff']);
  }
}
