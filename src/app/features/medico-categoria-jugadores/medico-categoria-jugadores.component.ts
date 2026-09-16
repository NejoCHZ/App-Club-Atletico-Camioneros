import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-medico-categoria-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medico-categoria-jugadores.component.html',
  styleUrl: './medico-categoria-jugadores.component.css'
})
export class MedicoCategoriaJugadoresComponent implements OnInit {
  private jugadorService = inject(JugadorService);
  constructor(private router: Router) {}

  searchTerm = '';
  posicionFiltro = '';

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Categorías', icon: 'category', active: false }
  ];

  players: Jugador[] = [];

  ngOnInit() {
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

  editarJugador(id: number) {
    this.router.navigate(['/medico']);
  }
}
