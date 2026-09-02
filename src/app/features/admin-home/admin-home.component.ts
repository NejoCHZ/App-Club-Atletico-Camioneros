import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  fechaNacimiento: string;
  estadoCuota: 'AL DÍA' | 'PENDIENTE' | 'ADEUDA';
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent {
  constructor(private router: Router) {}

  irAAltaJugador() {
    this.router.navigate(['/admin/alta-jugador']);
  }

  searchTerm = '';
  categoriaFiltro = '';
  ordenFiltro = '';

  activeTab = 'Inicio';

  navItems = [
    { label: 'Inicio', icon: 'home', active: true },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  kpiCards = [
    {
      title: 'Jugadores Activos',
      value: '+500',
      type: 'jugadores',
      icon: 'group'
    },
    {
      title: 'Categorias Activas',
      value: '+16',
      type: 'categorias',
      icon: 'flag'
    }
  ];

  players: Player[] = [
    {
      id: 1,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019',
      estadoCuota: 'AL DÍA'
    },
    {
      id: 2,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019',
      estadoCuota: 'PENDIENTE'
    },
    {
      id: 3,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019',
      estadoCuota: 'ADEUDA'
    },
    {
      id: 4,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019',
      estadoCuota: 'AL DÍA'
    }
  ];

  get filteredPlayers(): Player[] {
    return this.players
      .filter(p => {
        const term = this.searchTerm.trim().toLowerCase();
        const matchSearch = !term ||
          p.nombreCompleto.toLowerCase().includes(term) ||
          p.dni.includes(term);
        const matchCat = !this.categoriaFiltro || p.categoria.toUpperCase() === this.categoriaFiltro.toUpperCase();
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return a.nombreCompleto.localeCompare(b.nombreCompleto);
        if (this.ordenFiltro === 'dni') return a.dni.localeCompare(b.dni);
        if (this.ordenFiltro === 'categoria') return a.categoria.localeCompare(b.categoria);
        return 0;
      });
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Inicio') {
      this.router.navigate(['/admin']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    }
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarPerfil(id: number) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }

  getBadgeClass(estado: Player['estadoCuota']): string {
    switch (estado) {
      case 'AL DÍA': return 'badge-aldia';
      case 'PENDIENTE': return 'badge-pendiente';
      case 'ADEUDA': return 'badge-adeuda';
      default: return '';
    }
  }
}
