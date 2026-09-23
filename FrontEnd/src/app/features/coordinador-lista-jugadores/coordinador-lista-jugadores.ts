import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  posicion: 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO';
  edad: string;
  categoria: string;
}

@Component({
  selector: 'app-coordinador-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-lista-jugadores.html',
  styleUrl: './coordinador-lista-jugadores.css'
})
export class CoordinadorListaJugadores implements OnInit {
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  searchTerm = '';
  posicionFiltro = ''; // '' | 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO'

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  players: Player[] = [
    { id: 1, nombreCompleto: 'JUAN PÉREZ', dni: '45.123.456', posicion: 'ARQUERO', edad: '17 Años', categoria: 'CATEGORÍA 2009' },
    { id: 2, nombreCompleto: 'JUAN PADELA', dni: '43.987.654', posicion: 'DEFENSOR', edad: '19 Años', categoria: 'CATEGORÍA 2006' },
    { id: 3, nombreCompleto: 'LAURA GONZÁLEZ', dni: '48.555.444', posicion: 'VOLANTE', edad: '14 Años', categoria: 'CATEGORÍA 2012' },
    { id: 4, nombreCompleto: 'PEDRO SÁNCHEZ', dni: '46.333.222', posicion: 'DELANTERO', edad: '16 Años', categoria: 'CATEGORÍA 2010' },
    { id: 5, nombreCompleto: 'MATEO GÓMEZ', dni: '46.789.012', posicion: 'DEFENSOR', edad: '15 Años', categoria: 'CATEGORÍA 2009' },
    { id: 6, nombreCompleto: 'LUCAS FERNÁNDEZ', dni: '45.987.654', posicion: 'VOLANTE', edad: '15 Años', categoria: 'CATEGORÍA 2009' },
    { id: 7, nombreCompleto: 'SANTIAGO RODRÍGUEZ', dni: '46.321.654', posicion: 'DELANTERO', edad: '15 Años', categoria: 'CATEGORÍA 2009' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

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

  selectNav(item: any) {
    this.navItems.forEach(n => n.active = (n.label === item.label));
    this.activeTab = item.label;
    if (item.route && item.route !== '#') {
      this.router.navigate([item.route]);
    }
  }

  verFicha(player: Player) {
    this.router.navigate(['/coordinador/visualizar-perfil'], {
      queryParams: { player: player.nombreCompleto }
    });
  }

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }
}
