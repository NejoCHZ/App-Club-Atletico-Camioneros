import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PosicionJugador } from '../../shared/models/jugador.model';
import { JugadorService } from '../../shared/services/jugador.service';
import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

@Component({
  selector: 'app-admin-alta-jugador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-alta-jugador.component.html',
  styleUrl: './admin-alta-jugador.component.css'
})
export class AdminAltaJugadorComponent {
  mostrarPopupCredencial = false;
  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  // Mapeo exacto de las categorías con sus IDs de la base de datos
  categoriasList = [
    { id: '1', nombre: 'Primera' },
    { id: '2', nombre: 'Reserva' },
    { id: '3', nombre: 'Juvenil' },
    { id: '4', nombre: 'Infantil' },
    { id: '5', nombre: 'Cebollitas' }
  ];

  // Datos del Jugador
  dni = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  categoria = ''; // Ahora guardará el ID (ej: "1") en lugar del texto
  posicion: PosicionJugador | '' = '';
  clubOrigen = '';
  aptoFisico = false;

  // Datos del Tutor / Responsable
  buscarTutorDni = '';
  tutorNombre = '';
  tutorApellido = '';
  tutorTelefono = '';
  tutorEmail = '';

  edadCalculada: number | null = null;
  esMenorDeEdad = true;
  mensajeExito = false;
  formularioEnviado = false;
  guardando = false;
  errorGuardado = '';

  constructor(
    private readonly router: Router,
    private readonly jugadorService: JugadorService
  ) { }

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
    this.router.navigate(['/admin']);
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

    this.evaluarEdad(formatted);
  }

  evaluarEdad(fechaStr: string) {
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
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        this.edadCalculada = age;
        this.esMenorDeEdad = age < 18;

        if (!this.esMenorDeEdad) {
          // Limpiar campos del tutor si es mayor de edad
          this.buscarTutorDni = '';
          this.tutorNombre = '';
          this.tutorApellido = '';
          this.tutorTelefono = '';
          this.tutorEmail = '';
        }
        return;
      }
    }

    this.edadCalculada = null;
    this.esMenorDeEdad = true;
  }

  buscarTutor() {
    if (!this.esMenorDeEdad || !this.buscarTutorDni) return;

    if (this.buscarTutorDni === '30123456') {
      this.tutorNombre = 'Carlos';
      this.tutorApellido = 'Gómez';
      this.tutorTelefono = '11 6072-3341';
      this.tutorEmail = 'carlos.gomez@gmail.com';
    } else {
      alert('No se encontró tutor con el DNI ingresado. Por favor complete los datos.');
    }
  }

  generarCredencial() {
    this.guardarYGenerarQR();
  }

  descargarCredencial() {
    alert('Descargando credencial...');
  }

  guardarYGenerarQR() {
    if (this.guardando) {
      return;
    }

    this.formularioEnviado = true;
    this.errorGuardado = '';

    if (!this.dni || !this.nombre || !this.apellido || !this.fechaNacimiento || !this.categoria || !this.posicion) {
      alert('Por favor complete los campos obligatorios (*) del Jugador.');
      return;
    }

    const fechaNacimiento = this.convertirFechaAFormatoApi(this.fechaNacimiento);
    if (!fechaNacimiento) {
      this.errorGuardado = 'Ingresá una fecha de nacimiento válida en formato dd/mm/aaaa.';
      return;
    }

    if (this.esMenorDeEdad) {
      if (!this.buscarTutorDni || !this.tutorNombre || !this.tutorApellido || !this.tutorTelefono || !this.tutorEmail) {
        alert('Por ser menor de 18 años, debe completar los campos obligatorios (*) del Tutor.');
        return;
      }
    }

    const nuevoJugador = {
      dni: this.dni,
      nombre: this.nombre,
      apellido: this.apellido,
      fechaNacimiento,
      categoria: this.categoria, // Acá ahora viaja el ID numérico en formato string (ej: "1")
      posicion: this.posicion,
      clubOrigen: this.clubOrigen || null,
      aptoFisico: this.aptoFisico,
      tutor: this.esMenorDeEdad ? {
        dni: this.buscarTutorDni,
        nombre: this.tutorNombre,
        apellido: this.tutorApellido,
        telefono: this.tutorTelefono,
        email: this.tutorEmail
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
          ? 'Ya existe un jugador con ese DNI.'
          : 'No se pudo registrar el jugador. Verificá los datos y que la API esté en ejecución.';
        this.guardando = false;
      }
    });
  }

  private convertirFechaAFormatoApi(fecha: string): string | null {
    const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
    if (!coincidencia) {
      return null;
    }

    const [, dia, mes, anio] = coincidencia;
    const fechaValidada = new Date(Number(anio), Number(mes) - 1, Number(dia));
    const esValida = fechaValidada.getFullYear() === Number(anio) &&
      fechaValidada.getMonth() === Number(mes) - 1 &&
      fechaValidada.getDate() === Number(dia) &&
      fechaValidada <= new Date();

    return esValida ? `${anio}-${mes}-${dia}` : null;
  }
}
