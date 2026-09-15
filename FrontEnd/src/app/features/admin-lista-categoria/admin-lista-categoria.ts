import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export interface CategoriaItem {
  id: number;
  nombre: string;
  cantidadJugadores: string;
  asociacion: string;
}

@Component({
  selector: 'app-admin-lista-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-categoria.html',
  styleUrl: './admin-lista-categoria.css',
})
export class AdminListaCategoria {
  constructor(private router: Router) {}

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';

  activeTab = 'Categorias';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: true }
  ];

  categorias: CategoriaItem[] = [
    {
      id: 1,
      nombre: 'NOMBRE DE LA CATEGORIA',
      cantidadJugadores: 'CANTIDAD JUGADORES',
      asociacion: 'Liga Cordobesa'
    },
    {
      id: 2,
      nombre: 'NOMBRE DE LA CATEGORIA',
      cantidadJugadores: 'CANTIDAD JUGADORES',
      asociacion: 'Liga Cordobesa'
    },
    {
      id: 3,
      nombre: 'NOMBRE DE LA CATEGORIA',
      cantidadJugadores: 'CANTIDAD JUGADORES',
      asociacion: 'Liga Cordobesa'
    },
    {
      id: 4,
      nombre: 'NOMBRE DE LA CATEGORIA',
      cantidadJugadores: 'CANTIDAD JUGADORES',
      asociacion: 'AFA'
    },
    {
      id: 5,
      nombre: 'NOMBRE DE LA CATEGORIA',
      cantidadJugadores: 'CANTIDAD JUGADORES',
      asociacion: 'AFA'
    },
    {
      id: 6,
      nombre: 'NOMBRE DE LA CATEGORIA',
      cantidadJugadores: 'CANTIDAD JUGADORES',
      asociacion: 'Liga Cordobesa'
    }
  ];

  get filteredCategorias(): CategoriaItem[] {
    return this.categorias
      .filter(c => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term || c.nombre.toLowerCase().includes(term);
        const matchAso = !this.asociacionFiltro || c.asociacion === this.asociacionFiltro;
        return matchSearch && matchAso;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombre.localeCompare(b.nombre);
        return 0;
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

  verCategoria(id: number) {
    this.router.navigate(['/admin/categoria', id, 'jugadores']);
  }
}
