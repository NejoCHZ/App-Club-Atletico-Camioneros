import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

@Component({
  selector: 'app-admin-alta-trabajador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-alta-trabajador.component.html',
  styleUrl: './admin-alta-trabajador.component.css'
})
export class AdminAltaTrabajadorComponent {
  mostrarPopupCredencial = false;
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

  // Card 2: Datos del empleado / Contacto y Seguridad
  telefono = '';
  email = '';
  password = '';
  repeatPassword = '';
  domicilio = '';
  contactoEmergencia = '';
  patologias = '';
  observacionesMedicas = '';

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
    this.mostrarPopupCredencial = true;
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

    this.mostrarPopupCredencial = true;
  }
}
