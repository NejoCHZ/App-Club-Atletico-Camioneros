import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface PlayerDT {
  id: number;
  nombreCompleto: string;
  dni: string;
  posicion: 'Arqueros' | 'Defensores' | 'Volantes' | 'Delanteros';
  edad: string;
}

@Component({
  selector: 'app-dt-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-home.component.html',
  styleUrl: './dt-home.component.css'
})
export class DtHomeComponent {
  constructor(private router: Router) {}

  verFicha(player: PlayerDT) {
    this.router.navigate(['/dt/jugador', player.id]);
  }
  searchTerm = '';
  posicionFiltro = ''; // '' means all positions

  navItems = [
    { label: 'Plantel', icon: 'plantel', active: false },
    { label: 'Estadísticas', icon: 'estadisticas', active: false },
    { label: 'Configuración', icon: 'configuracion', active: false }
  ];

  players: PlayerDT[] = [
    {
      id: 1,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '43.123.456',
      posicion: 'Delanteros',
      edad: '14 AÑOS'
    },
    {
      id: 2,
      nombreCompleto: 'CARLOS GUTIERREZ',
      dni: '43.123.456',
      posicion: 'Defensores',
      edad: '15 AÑOS'
    },
    {
      id: 3,
      nombreCompleto: 'EMILIANO MARTINEZ',
      dni: '43.123.456',
      posicion: 'Arqueros',
      edad: '14 AÑOS'
    },
    {
      id: 4,
      nombreCompleto: 'MATEO BENITEZ',
      dni: '43.123.456',
      posicion: 'Volantes',
      edad: '16 AÑOS'
    },
    {
      id: 5,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'Defensores',
      edad: '00 AÑOS'
    },
    {
      id: 6,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'Volantes',
      edad: '00 AÑOS'
    }
  ];

  get filteredPlayers(): PlayerDT[] {
    return this.players.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.dni.includes(this.searchTerm);

      const matchPos = !this.posicionFiltro || p.posicion === this.posicionFiltro;

      return matchSearch && matchPos;
    });
  }

  setPosicionFiltro(posicion: string) {
    if (this.posicionFiltro === posicion) {
      this.posicionFiltro = ''; // Toggle off
    } else {
      this.posicionFiltro = posicion;
    }
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
  }
}
