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
  fechaNacimiento?: string;
  categoria?: string;
  estadoCuota?: 'AL DÍA' | 'PENDIENTE' | 'ADEUDA';
}

@Component({
  selector: 'app-admin-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-jugadores.html',
  styleUrl: './admin-lista-jugadores.css',
})
export class AdminListaJugadores {
  constructor(private router: Router) {}

  searchTerm = '';
  posicionFiltro = ''; // '' | 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO'

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  players: Player[] = [
    {
      id: 1,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'DELANTERO',
      edad: '00 AÑOS',
      fechaNacimiento: '01/01/2010',
      categoria: 'CEBOLLITAS',
      estadoCuota: 'AL DÍA'
    },
    {
      id: 2,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'VOLANTE',
      edad: '00 AÑOS',
      fechaNacimiento: '15/04/2012',
      categoria: 'CEBOLLITAS',
      estadoCuota: 'PENDIENTE'
    },
    {
      id: 3,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'DEFENSOR',
      edad: '00 AÑOS',
      fechaNacimiento: '20/09/2014',
      categoria: 'CEBOLLITAS',
      estadoCuota: 'ADEUDA'
    },
    {
      id: 4,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'ARQUERO',
      edad: '00 AÑOS',
      fechaNacimiento: '14/05/2015',
      categoria: 'INFANTIL',
      estadoCuota: 'AL DÍA'
    },
    {
      id: 5,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'DELANTERO',
      edad: '00 AÑOS',
      fechaNacimiento: '22/10/2013',
      categoria: 'JUVENIL',
      estadoCuota: 'PENDIENTE'
    },
    {
      id: 6,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      posicion: 'DEFENSOR',
      edad: '00 AÑOS',
      fechaNacimiento: '03/03/2011',
      categoria: 'JUVENIL',
      estadoCuota: 'AL DÍA'
    }
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
      this.router.navigate(['/admin']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    }
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarJugador(id: number) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }
}
