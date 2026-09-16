import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  private jugadorService = inject(JugadorService);
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
      value: '',
      type: 'jugadores',
      icon: 'group'
    },
    {
      title: 'Categorias Activas',
      value: '',
      type: 'categorias',
      icon: 'flag'
    }
  ];

  players: Jugador[] = [];

  ngOnInit() {
    this.jugadorService.getJugadores().subscribe(data => this.players = data);
  }

  get filteredPlayers(): Jugador[] {
    return this.players
      .filter(p => {
        const term = this.searchTerm.trim().toLowerCase();
        const nombreCompleto = p.nombre + ' ' + p.apellido;
        const matchSearch = !term ||
          nombreCompleto.toLowerCase().includes(term) ||
          p.dni.includes(term);
        const matchCat = !this.categoriaFiltro || (p.nombreCategoria && p.nombreCategoria.toUpperCase() === this.categoriaFiltro.toUpperCase());
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (this.ordenFiltro === 'nombre') return (a.nombre + ' ' + a.apellido).localeCompare(b.nombre + ' ' + b.apellido);
        if (this.ordenFiltro === 'dni') return a.dni.localeCompare(b.dni);
        if (this.ordenFiltro === 'categoria') return (a.nombreCategoria || '').localeCompare(b.nombreCategoria || '');
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

  getBadgeClass(estado: string | undefined): string {
    switch (estado) {
      case 'AL DÍA': return 'badge-aldia';
      case 'PENDIENTE': return 'badge-pendiente';
      case 'ADEUDA': return 'badge-adeuda';
      default: return '';
    }
  }
}
