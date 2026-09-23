import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface PlayerDT {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  fechaNacimiento: string;
  foto?: string;
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

  cantidadJugadores = 20;
  categoriaAsignada = 'Sub 15';

  searchTerm = '';
  filtroCategoria = '';
  ordenarPor = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: true },
    { label: 'Jugadores', icon: 'jugadores', active: false },
    { label: 'Categorias', icon: 'categorias', active: false }
  ];

  categoriasDisponibles = ['CEBOLLITAS', 'SUB 13', 'SUB 15', 'SUB 17', 'RESERVA', 'PRIMERA'];

  players: PlayerDT[] = [
    {
      id: 1,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019'
    },
    {
      id: 2,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019'
    },
    {
      id: 3,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019'
    },
    {
      id: 4,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019'
    }
  ];

  get filteredPlayers(): PlayerDT[] {
    let result = this.players.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.dni.includes(this.searchTerm);

      const matchCat = !this.filtroCategoria || p.categoria === this.filtroCategoria;

      return matchSearch && matchCat;
    });

    if (this.ordenarPor === 'nombre') {
      result.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    } else if (this.ordenarPor === 'dni') {
      result.sort((a, b) => a.dni.localeCompare(b.dni));
    }

    return result;
  }

  verFicha(player: PlayerDT) {
    this.router.navigate(['/dt/jugador', player.id]);
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    if (label === 'Categorias') {
      this.router.navigate(['/dt/categorias']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/dt-categoria-jugadores']);
    } else if (label === 'Inicio') {
      this.router.navigate(['/dt']);
    }
  }
}

