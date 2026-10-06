import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PosicionJugador } from '../../shared/models/jugador.model';
import { JugadorService } from '../../shared/services/jugador.service';
import { AuthService } from '../../shared/services/auth.service';
import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

export interface CategoriaSelectOption {
  id: number;
  nombre: string;
  asociacion: string;
}

@Component({
  selector: 'app-admin-alta-jugador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-alta-jugador.component.html',
  styleUrl: './admin-alta-jugador.component.css'
})
export class AdminAltaJugadorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly jugadorService = inject(JugadorService);
  private readonly authService = inject(AuthService);

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  sidebarOculto = false;
  menuUsuarioAbierto = false;

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  categoriasList: CategoriaSelectOption[] = [];

  // Posiciones estándar del CACC
  posicionesDisponibles: string[] = [
    'Arquero',
    'Defensor',
    'Mediocampista',
    'Delantero'
  ];

  // Datos del Jugador
  dni = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  categoria: number | '' = '';
  posicion: PosicionJugador | string = '';
  clubOrigen = '';
  aptoFisico = false;

  // Datos del Tutor / Responsable
  tutorDni = '';
  tutorNombre = '';
  tutorApellido = '';
  tutorTelefono = '';
  tutorEmail = '';
  tutorParentesco = 'Padre';
  tutorParentescoOtro = '';

  edadCalculada: number | null = null;
  esMenorDeEdad = true;
  mensajeExito = false;
  formularioEnviado = false;
  guardando = false;
  errorGuardado = '';

  mostrarPopupCredencial = false;

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarCategoriasDesdeBD();
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

  cargarCategoriasDesdeBD(): void {
    this.http.get<any[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.categoriasList = data.map(c => ({
          id: c.idCategoria || c.PK_id_categoria || c.pk_id_categoria || c.id,
          nombre: c.nombreCategoria || c.nombre_categoria || c.nombre,
          asociacion: c.asociacion || ((c.nombreCategoria || '').toUpperCase().includes('AFA') ? 'AFA' : 'Liga Cordobesa')
        }));
      },
      error: (err) => {
        console.error('Error al cargar categorias desde el Backend:', err);
        this.categoriasList = [];
      }
    });
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
      if (input.value.endsWith('/')) formatted = input.value.slice(0, -1);
    }

    this.fechaNacimiento = formatted;
    input.value = formatted;
    this.evaluarEdad(formatted);
  }

  evaluarEdad(fechaStr: string): void {
    const parts = fechaStr.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 0 && month < 12 && day > 0 && day <= 31) {
        const birthDate = new Date(year, month, day);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

        this.edadCalculada = age;
        this.esMenorDeEdad = age < 18;

        if (!this.esMenorDeEdad) {
          this.limpiarDatosTutor();
        }
        return;
      }
    }
    this.edadCalculada = null;
    this.esMenorDeEdad = true;
  }

  limpiarDatosTutor(): void {
    this.tutorDni = '';
    this.tutorNombre = '';
    this.tutorApellido = '';
    this.tutorTelefono = '';
    this.tutorEmail = '';
    this.tutorParentesco = 'Padre';
    this.tutorParentescoOtro = '';
  }

  buscarTutor(): void {
    const dniLimpio = this.tutorDni.trim();
    if (!this.esMenorDeEdad || !dniLimpio) return;

    this.http.get<any[]>('http://localhost:5191/api/jugadores').subscribe({
      next: (data) => {
        const jugadorConTutor = data.find(j => {
          const t = j.tutor || j.Tutor;
          return t && t.dni === dniLimpio;
        });

        const tutor = jugadorConTutor?.tutor || jugadorConTutor?.Tutor;
        if (tutor && tutor.nombre) {
          this.tutorNombre = tutor.nombre || '';
          this.tutorApellido = tutor.apellido || '';
          this.tutorTelefono = tutor.telefono || '';
          this.tutorEmail = tutor.email || '';
          this.tutorParentesco = tutor.parentesco || 'Padre';
        } else {
          alert('No se encontró un tutor previo con ese DNI. Por favor complete los datos manualmente para registrarlo.');
        }
      },
      error: () => {
        alert('No se encontró un tutor previo con ese DNI. Por favor complete los datos manualmente para registrarlo.');
      }
    });
  }

  guardarYGenerarQR(): void {
    if (this.guardando) return;
    this.formularioEnviado = true;
    this.errorGuardado = '';

    if (!this.dni.trim() || !this.nombre.trim() || !this.apellido.trim() || !this.fechaNacimiento || !this.categoria || !this.posicion) {
      alert('Por favor complete los campos obligatorios (*) del Jugador.');
      return;
    }

    const fechaNacimientoIso = this.convertirFechaAFormatoApi(this.fechaNacimiento);
    if (!fechaNacimientoIso) {
      this.errorGuardado = 'Ingresá una fecha de nacimiento válida en formato dd/mm/aaaa.';
      return;
    }

    if (this.esMenorDeEdad) {
      if (!this.tutorDni.trim() || !this.tutorNombre.trim() || !this.tutorApellido.trim() || !this.tutorTelefono.trim() || !this.tutorParentesco) {
        alert('Por ser menor de 18 años, debe completar los campos obligatorios (*) del Tutor Responsable.');
        return;
      }
      if (this.tutorParentesco === 'OTRO' && !this.tutorParentescoOtro.trim()) {
        alert('Por favor especifique el parentesco del tutor.');
        return;
      }
    }

    const parentescoFinal = this.tutorParentesco === 'OTRO' ? this.tutorParentescoOtro.trim() : this.tutorParentesco;

    const nuevoJugador = {
      dni: this.dni.trim(),
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      fechaNacimiento: fechaNacimientoIso,
      categoria: this.categoria ? this.categoria.toString() : '',
      posicion: this.posicion as any,
      clubOrigen: this.clubOrigen?.trim() || null,
      aptoFisico: this.aptoFisico,
      tutor: this.esMenorDeEdad ? {
        dni: this.tutorDni.trim(),
        nombre: this.tutorNombre.trim(),
        apellido: this.tutorApellido.trim(),
        telefono: this.tutorTelefono.trim(),
        email: this.tutorEmail?.trim() || '',
        parentesco: parentescoFinal
      } : null
    };

    this.guardando = true;
    this.jugadorService.crear(nuevoJugador).subscribe({
      next: (jugador) => {
        this.dni = jugador.dni;
        this.nombre = jugador.nombre;
        this.apellido = jugador.apellido;
        this.mensajeExito = true;
        this.mostrarPopupCredencial = true;
        this.guardando = false;
      },
      error: (error: unknown) => {
        this.errorGuardado = error instanceof HttpErrorResponse && error.status === 409
          ? 'Ya existe un jugador registrado con ese número de DNI.'
          : 'No se pudo registrar el jugador. Verifique los datos ingresados y el estado del servidor.';
        this.guardando = false;
      }
    });
  }

  descargarCredencial(): void {
    alert('Descargando credencial oficial en formato PDF...');
  }

  volver(): void {
    this.router.navigate(['/admin/lista-jugadores']);
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

  selectNav(label: string): void {
    this.navItems.forEach(item => item.active = (item.label === label));
    if (label === 'Inicio') this.router.navigate(['/admin']);
    else if (label === 'Jugadores') this.router.navigate(['/admin/lista-jugadores']);
    else if (label === 'Categorias' || label === 'Categorías') this.router.navigate(['/admin/categorias']);
    else if (label === 'Staff') this.router.navigate(['/admin/staff']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private convertirFechaAFormatoApi(fecha: string): string | null {
    const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
    if (!coincidencia) return null;
    const [, dia, mes, anio] = coincidencia;
    const fechaValidada = new Date(Number(anio), Number(mes) - 1, Number(dia));
    const esValida = fechaValidada.getFullYear() === Number(anio) &&
      fechaValidada.getMonth() === Number(mes) - 1 &&
      fechaValidada.getDate() === Number(dia) &&
      fechaValidada <= new Date();

    return esValida ? `${anio}-${mes}-${dia}T00:00:00` : null;
  }
}
