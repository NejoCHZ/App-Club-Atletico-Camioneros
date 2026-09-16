import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

@Component({
  selector: 'app-admin-lista-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-categoria.html',
  styleUrl: './admin-lista-categoria.css',
})
export class AdminListaCategoria implements OnInit {
  private categoriaService = inject(CategoriaService);
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

  categorias: Categoria[] = [];

  ngOnInit() {
    this.categoriaService.getCategorias().subscribe(data => this.categorias = data);
  }

  get filteredCategorias(): Categoria[] {
    return this.categorias
      .filter(c => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term || c.nombreCategoria.toLowerCase().includes(term);
        // Removed aso match since Categoria might not have asociacion. Add it back if needed
        return matchSearch;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCategoria.localeCompare(b.nombreCategoria);
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
