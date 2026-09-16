import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

@Component({
  selector: 'app-coordinador-seleccion-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-seleccion-categorias.html',
  styleUrl: './coordinador-seleccion-categorias.css'
})
export class CoordinadorSeleccionCategorias implements OnInit {
  private categoriaService = inject(CategoriaService);
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';

  activeTab = 'Categorias';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: true, route: '/coordinador-seleccion-categorias' }
  ];

  categorias: Categoria[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.categoriaService.getCategorias().subscribe(data => this.categorias = data);
  }

  get filteredCategorias(): Categoria[] {
    return this.categorias
      .filter(c => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term || c.nombreCategoria.toLowerCase().includes(term);
        return matchSearch;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCategoria.localeCompare(b.nombreCategoria);
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
    const cat = this.categorias.find(c => c.idCategoria === id);
    if (cat) {
      this.onViewCategory(cat.nombreCategoria);
    }
  }
}
