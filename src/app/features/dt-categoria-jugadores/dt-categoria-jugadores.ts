import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-dt-categoria-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-categoria-jugadores.html',
  styleUrl: './dt-categoria-jugadores.css'
})
export class DtCategoriaJugadoresComponent implements OnInit {
  private jugadorService = inject(JugadorService);
  constructor(private router: Router) {}

  nombreCategoria = 'Plantel';
  searchTerm = '';
  posicionFiltro = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'jugadores', active: true },
    { label: 'Categorias', icon: 'categorias', active: false }
  ];

  players: Jugador[] = [];

  ngOnInit() {
    this.jugadorService.getJugadores().subscribe(data => this.players = data);
  }

  get filteredPlayers(): Jugador[] {
    return this.players.filter(p => {
      const nombreCompleto = p.nombre + ' ' + p.apellido;
      const matchSearch = !this.searchTerm ||
        nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.dni.includes(this.searchTerm);
      const matchPos = !this.posicionFiltro || p.posicionCancha === this.posicionFiltro;
      return matchSearch && matchPos;
    });
  }

  togglePosicion(posicion: string) {
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
