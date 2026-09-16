import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  // Datos del Jugador
  dni = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  categoria = '';
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

  constructor(private router: Router) {}

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
          // Clear tutor fields if player is 18 or older
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
    this.mostrarPopupCredencial = true;
  }

  descargarCredencial() {
    alert('Descargando credencial...');
  }

  guardarYGenerarQR() {
    if (!this.dni || !this.nombre || !this.apellido || !this.fechaNacimiento) {
      alert('Por favor complete los campos obligatorios (*) del Jugador.');
      return;
    }

    if (this.esMenorDeEdad) {
      if (!this.tutorNombre || !this.tutorApellido || !this.tutorTelefono) {
        alert('Por ser menor de 18 años, debe completar los campos obligatorios (*) del Tutor.');
        return;
      }
    }

    this.mostrarPopupCredencial = true;
  }
}
