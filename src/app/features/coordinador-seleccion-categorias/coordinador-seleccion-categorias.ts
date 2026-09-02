import { Component, OnInit } from '@angular/core';
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
  selector: 'app-coordinador-seleccion-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-seleccion-categorias.html',
  styleUrl: './coordinador-seleccion-categorias.css'
})
export class CoordinadorSeleccionCategorias implements OnInit {
  
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: true, route: '/coordinador-seleccion-categorias' }
  ];

  categorias: CategoriaItem[] = [
    { id: 1, nombre: 'CATEGORÍA 2009', cantidadJugadores: '24 JUGADORES', asociacion: 'Liga Cordobesa' },
    { id: 2, nombre: 'CATEGORÍA 2008', cantidadJugadores: '22 JUGADORES', asociacion: 'Liga Cordobesa' },
    { id: 3, nombre: 'CATEGORÍA 2004', cantidadJugadores: '18 JUGADORES', asociacion: 'AFA' },
    { id: 4, nombre: 'CATEGORÍA 2010', cantidadJugadores: '20 JUGADORES', asociacion: 'AFA' },
    { id: 5, nombre: 'CATEGORÍA 2012', cantidadJugadores: '15 JUGADORES', asociacion: 'Liga Cordobesa' },
    { id: 6, nombre: 'CATEGORÍA 2006', cantidadJugadores: '19 JUGADORES', asociacion: 'AFA' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

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

  selectNav(item: any) {
    this.navItems.forEach(n => n.active = (n.label === item.label));
    this.activeTab = item.label;
    if (item.route && item.route !== '#') {
      this.router.navigate([item.route]);
    }
  }

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }

  onViewCategory(categoryName: string): void {
    this.router.navigate(['/coordinador/visualizar-plantel'], {
      queryParams: { cat: categoryName }
    });
  }

  verCategoria(id: number): void {
    const cat = this.categorias.find(c => c.id === id);
    if (cat) {
      this.onViewCategory(cat.nombre);
    }
  }
}
