import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-dt-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-home.component.html',
  styleUrl: './dt-home.component.css'
})
export class DtHomeComponent implements OnInit {
  private jugadorService = inject(JugadorService);
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

  players: Jugador[] = [];

  ngOnInit() {
    this.jugadorService.getJugadores().subscribe(data => {
      this.players = data;
      this.cantidadJugadores = data.length;
    });
  }

  get filteredPlayers(): Jugador[] {
    let result = this.players.filter(p => {
      const nombreCompleto = p.nombre + ' ' + p.apellido;
      const matchSearch = !this.searchTerm ||
        nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.dni.includes(this.searchTerm);

      const matchCat = !this.filtroCategoria || (p.nombreCategoria && p.nombreCategoria === this.filtroCategoria);

      return matchSearch && matchCat;
    });

    if (this.ordenarPor === 'nombre') {
      result.sort((a, b) => (a.nombre + ' ' + a.apellido).localeCompare(b.nombre + ' ' + b.apellido));
    } else if (this.ordenarPor === 'dni') {
      result.sort((a, b) => a.dni.localeCompare(b.dni));
    }

    return result;
  }

  verFicha(player: Jugador) {
    this.router.navigate(['/dt/jugador', player.idJugador]);
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
