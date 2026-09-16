import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-coordinador-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-lista-jugadores.html',
  styleUrl: './coordinador-lista-jugadores.css'
})
export class CoordinadorListaJugadores implements OnInit {
  private jugadorService = inject(JugadorService);
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  searchTerm = '';
  posicionFiltro = ''; 

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  players: Jugador[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.jugadorService.getJugadores().subscribe(data => this.players = data);
  }

  togglePosicion(pos: string) {
    if (this.posicionFiltro === pos) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = pos;
    }
  }

  get filteredPlayers(): Jugador[] {
    return this.players.filter(p => {
      const term = this.searchTerm.trim().toLowerCase();
      const nombreCompleto = p.nombre + ' ' + p.apellido;
      const matchSearch = !term || nombreCompleto.toLowerCase().includes(term) || p.dni.includes(term);
      const matchPos = !this.posicionFiltro || p.posicionCancha === this.posicionFiltro;
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

  verFicha(player: Jugador) {
    this.router.navigate(['/coordinador/visualizar-perfil'], {
      queryParams: { player: player.nombre + ' ' + player.apellido }
    });
  }

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }
}
