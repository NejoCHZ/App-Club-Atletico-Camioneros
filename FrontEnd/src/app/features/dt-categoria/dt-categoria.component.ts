import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface CategoriaDT {
  id: number;
  nombre: string;
  cantidadJugadores: string;
  asociacion: string;
}

@Component({
  selector: 'app-dt-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-categoria.component.html',
  styleUrl: './dt-categoria.component.css'
})
export class DtCategoriaComponent {
  constructor(private router: Router) {}

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'jugadores', active: false },
    { label: 'Categorias', icon: 'categorias', active: true }
  ];

  categorias: CategoriaDT[] = [
    { id: 1, nombre: 'NOMBRE DE LA CATEGORIA', cantidadJugadores: 'CANTIDAD JUGADORES', asociacion: 'Liga Cordobesa' },
    { id: 2, nombre: 'NOMBRE DE LA CATEGORIA', cantidadJugadores: 'CANTIDAD JUGADORES', asociacion: 'Liga Cordobesa' },
    { id: 3, nombre: 'NOMBRE DE LA CATEGORIA', cantidadJugadores: 'CANTIDAD JUGADORES', asociacion: 'Liga Cordobesa' },
    { id: 4, nombre: 'NOMBRE DE LA CATEGORIA', cantidadJugadores: 'CANTIDAD JUGADORES', asociacion: 'AFA' },
    { id: 5, nombre: 'NOMBRE DE LA CATEGORIA', cantidadJugadores: 'CANTIDAD JUGADORES', asociacion: 'AFA' },
    { id: 6, nombre: 'NOMBRE DE LA CATEGORIA', cantidadJugadores: 'CANTIDAD JUGADORES', asociacion: 'AFA' }
  ];

  get filteredCategorias(): CategoriaDT[] {
    let result = this.categorias.filter(c => {
      const matchSearch = !this.searchTerm ||
        c.nombre.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchAso = !this.asociacionFiltro || c.asociacion === this.asociacionFiltro;
      return matchSearch && matchAso;
    });

    if (this.ordenFiltro === 'nombre') {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return result;
  }

  verCategoria(id: number) {
    this.router.navigate(['/dt-categoria-jugadores']);
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
