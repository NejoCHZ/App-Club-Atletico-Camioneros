import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface PartidoEditable {
  dia: string;
  fecha: string;
  rival: string;
  golesLocal: string;
  golesVisita: string;
  minutos: string;
}

export interface PlayerFichaDetail {
  nombreCompleto: string;
  posicion: string;
  fechaNacimiento: string;
  edad: string;
  peso: string;
  altura: string;
  pieHabil: string;
  grupoSanguineo: string;
  tutor: string;
  telefonoTutor: string;
  domicilio: string;
  totalMinutosJugados: string;
  patologias: string;
  lesiones: string[];
  observacionesMedicas: string;
  historialPartidos: PartidoEditable[];
}

@Component({
  selector: 'app-dt-editar-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-editar-historial.html',
  styleUrl: './dt-editar-historial.css'
})
export class DtEditarHistorialComponent {
  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'jugadores', active: false },
    { label: 'Categorias', icon: 'categorias', active: false }
  ];

  player: PlayerFichaDetail = {
    nombreCompleto: 'NOMBRE Y APELLIDO',
    posicion: 'POSICION',
    fechaNacimiento: 'DD/MM/AAAA',
    edad: '00 Años',
    peso: '00 Kg',
    altura: '0.00 m',
    pieHabil: 'Derecho',
    grupoSanguineo: '0 +',
    tutor: 'Nombre y apellido',
    telefonoTutor: '0000000000',
    domicilio: 'Calle falsa 123',
    totalMinutosJugados: "00'",
    patologias: '',
    lesiones: [
      'Lesion 1',
      'Lesion 2',
      'Lesion 3',
      '.',
      '.',
      '.'
    ],
    observacionesMedicas: '',
    historialPartidos: Array.from({ length: 20 }, (_, i) => ({
      dia: 'DD/MM',
      fecha: '00',
      rival: 'NOMBRE RIVAL',
      golesLocal: '00',
      golesVisita: '00',
      minutos: "00'"
    }))
  };

  constructor(private router: Router) {}

  cancelar() {
    this.router.navigate(['/dt-ficha-jugador']);
  }

  guardar() {
    this.router.navigate(['/dt-ficha-jugador']);
  }

  selectNav(label: string) {
    if (label === 'Inicio') {
      this.router.navigate(['/dt']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/dt-categoria-jugadores']);
    } else if (label === 'Categorias') {
      this.router.navigate(['/dt/categorias']);
    }
  }
}
