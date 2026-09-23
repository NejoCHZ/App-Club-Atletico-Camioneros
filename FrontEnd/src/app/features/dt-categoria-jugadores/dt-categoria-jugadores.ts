import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface PlayerCategoriaDT {
  id: number;
  nombreCompleto: string;
  dni: string;
  posicion: 'Arqueros' | 'Defensores' | 'Volantes' | 'Delanteros';
  edad: string;
}

@Component({
  selector: 'app-dt-categoria-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-categoria-jugadores.html',
  styleUrl: './dt-categoria-jugadores.css'
})
export class DtCategoriaJugadoresComponent {
  constructor(private router: Router) {}

  nombreCategoria = 'Plantel';
  searchTerm = '';
  posicionFiltro = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'jugadores', active: true },
    { label: 'Categorias', icon: 'categorias', active: false }
  ];

  players: PlayerCategoriaDT[] = [
    { id: 1, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'Delanteros', edad: '00 AÑOS' },
    { id: 2, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'Defensores', edad: '00 AÑOS' },
    { id: 3, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'Arqueros', edad: '00 AÑOS' },
    { id: 4, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'Volantes', edad: '00 AÑOS' },
    { id: 5, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'Defensores', edad: '00 AÑOS' },
    { id: 6, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'Volantes', edad: '00 AÑOS' }
  ];

  get filteredPlayers(): PlayerCategoriaDT[] {
    return this.players.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.dni.includes(this.searchTerm);
      const matchPos = !this.posicionFiltro || p.posicion === this.posicionFiltro;
      return matchSearch && matchPos;
    });
  }

  togglePosicion(posicion: 'Arqueros' | 'Defensores' | 'Volantes' | 'Delanteros') {
    if (this.posicionFiltro === posicion) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = posicion;
    }
  }

  verFicha(id: number) {
    this.router.navigate(['/dt/jugador', id]);
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
