import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

@Component({
  selector: 'app-dt-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-categoria.component.html',
  styleUrl: './dt-categoria.component.css'
})
export class DtCategoriaComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  constructor(private router: Router) {}

  searchTerm = '';
  asociacionFiltro = '';
  ordenFiltro = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'jugadores', active: false },
    { label: 'Categorias', icon: 'categorias', active: true }
  ];

  categorias: Categoria[] = [];

  ngOnInit() {
    this.categoriaService.getCategorias().subscribe(data => this.categorias = data);
  }

  get filteredCategorias(): Categoria[] {
    let result = this.categorias.filter(c => {
      const matchSearch = !this.searchTerm ||
        c.nombreCategoria.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchSearch;
    });

    if (this.ordenFiltro === 'nombre') {
      result.sort((a, b) => a.nombreCategoria.localeCompare(b.nombreCategoria));
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
