import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface PartidoHistorial {
  dia: string;
  fecha: number;
  rival: string;
  resultado: string;
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
  historialPartidos: PartidoHistorial[];
  totalMinutosJugados: string;
  patologias: string;
  lesiones: string[];
  observacionesMedicas: string;
}

@Component({
  selector: 'app-dt-ficha-jugador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dt-ficha-jugador.component.html',
  styleUrl: './dt-ficha-jugador.component.css'
})
export class DtFichaJugadorComponent {
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
      fecha: i + 1,
      rival: 'NOMBRE RIVAL',
      resultado: '0 - 0',
      minutos: "00'"
    }))
  };

  constructor(private router: Router) {}

  volverAlPlantel() {
    this.router.navigate(['/dt']);
  }

  editarHistorial() {
    this.router.navigate(['/dt-editar-historial']);
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
