import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  posicion: 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO';
  edad: string;
}

@Component({
  selector: 'app-medico-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medico-lista-jugadores.component.html',
  styleUrl: './medico-lista-jugadores.component.css'
})
export class MedicoListaJugadoresComponent {
  constructor(private router: Router) {}

  searchTerm = '';
  posicionFiltro = '';

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Categorías', icon: 'category', active: false }
  ];

  players: Player[] = [
    { id: 1, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DELANTERO', edad: '00 AÑOS' },
    { id: 2, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'VOLANTE', edad: '00 AÑOS' },
    { id: 3, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DEFENSOR', edad: '00 AÑOS' },
    { id: 4, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'ARQUERO', edad: '00 AÑOS' },
    { id: 5, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DELANTERO', edad: '00 AÑOS' },
    { id: 6, nombreCompleto: 'NOMBRE Y APELLIDO', dni: '43.123.456', posicion: 'DEFENSOR', edad: '00 AÑOS' }
  ];

  togglePosicion(pos: string) {
    if (this.posicionFiltro === pos) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = pos;
    }
  }

  get filteredPlayers(): Player[] {
    return this.players.filter(p => {
      const term = this.searchTerm.trim().toLowerCase();
      const matchSearch = !term || p.nombreCompleto.toLowerCase().includes(term) || p.dni.includes(term);
      const matchPos = !this.posicionFiltro || p.posicion === this.posicionFiltro;
      return matchSearch && matchPos;
    });
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;

    if (label === 'Inicio') {
      this.router.navigate(['/medico']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/medico/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/medico/categorias']);
    }
  }

  verFicha(id: number) {
    this.router.navigate(['/medico/ficha-jugador', id]);
  }
}
