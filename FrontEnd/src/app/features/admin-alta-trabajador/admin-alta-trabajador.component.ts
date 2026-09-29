import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

@Component({
  selector: 'app-admin-alta-trabajador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-alta-trabajador.component.html',
  styleUrl: './admin-alta-trabajador.component.css'
})
export class AdminAltaTrabajadorComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  // Control interactivo de UI
  menuUsuarioAbierto = false;
  sidebarOculto = false;
  mostrarPopupCredencial = false;
  mensajeExito = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  // Card 1: Datos del empleado
  dni = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  rol = '';
  fotoNombre: string | null = null;
  fotoPreview: string | null = null;

  // Card 2: Contacto y Seguridad
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

  toggleSidebar() {
    this.sidebarOculto = !this.sidebarOculto;
  }

  toggleMenuUsuario(event: MouseEvent) {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
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

  volver() {
    this.router.navigate(['/admin/staff']);
  }

  onFechaNacimientoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const inputEvent = event as InputEvent;

    let raw = input.value.replace(/\D/g, '');
    if (raw.length > 8) {
      raw = raw.substring(0, 8);
    }

    let formatted = '';
    if (raw.length > 0) {
      formatted = raw.substring(0, 2);
    }
    if (raw.length > 2) {
      formatted += '/' + raw.substring(2, 4);
    }
    if (raw.length > 4) {
      formatted += '/' + raw.substring(4, 8);
    }

    if (inputEvent && inputEvent.inputType === 'deleteContentBackward') {
      if (input.value.endsWith('/')) {
        formatted = input.value.slice(0, -1);
      }
    }

    this.fechaNacimiento = formatted;
    input.value = formatted;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fotoNombre = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  generarCredencial() {
    this.guardarYGenerarQR();
  }

  descargarCredencial() {
    alert('Descargando credencial...');
  }

  guardarYGenerarQR() {
    if (!this.dni || !this.nombre || !this.apellido || !this.fechaNacimiento || !this.rol) {
      alert('Por favor complete los campos obligatorios (*) de los Datos del Empleado.');
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

    // Convertir dd/mm/aaaa a formato ISO yyyy-mm-dd
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
      rol: this.rol
    };

    this.http.post<any>('http://localhost:5191/api/staff', payload).subscribe({
      next: (res) => {
        this.mensajeExito = true;
        this.mostrarPopupCredencial = true;
      },
      error: (err) => {
        if (err.status === 409) {
          alert('Ya existe un empleado o usuario registrado con ese DNI o Email.');
        } else {
          alert('Error al registrar el empleado en la base de datos: ' + (err.error?.message || 'Error del servidor'));
        }
      }
    });
  }
}
