import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

@Component({
  selector: 'app-medico-seleccion-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medico-seleccion-categorias.component.html',
  styleUrl: './medico-seleccion-categorias.component.css'
})
export class MedicoSeleccionCategoriasComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  constructor(private router: Router) {}

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';

  activeTab = 'Categorías';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Categorías', icon: 'category', active: true }
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
      this.router.navigate(['/medico']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/medico/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/medico/categorias']);
    }
  }

  verCategoria(id: number) {
    this.router.navigate(['/medico/categoria-jugadores']);
  }
}
