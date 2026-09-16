import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-admin-categoria-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-categoria-jugadores.html',
  styleUrl: './admin-categoria-jugadores.css',
})
export class AdminCategoriaJugadores implements OnInit {
  private jugadorService = inject(JugadorService);
  categoryId = 1;
  nombreCategoria = 'NOMBRE CATEGORIA';
  searchTerm = '';
  posicionFiltro = '';

  activeTab = 'Categorias';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: true }
  ];

  players: Jugador[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.categoryId = Number(idParam);
        this.jugadorService.getJugadores().subscribe(data => {
          this.players = data.filter(p => p.idCategoria === this.categoryId);
        });
      }
    });
  }

  togglePosicion(pos: string) {
    if (this.posicionFiltro === pos) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = pos;
    }
  }

  get filteredPlayers(): Jugador[] {
    return this.players.filter(p => {
      const term = this.searchTerm.trim().toLowerCase();
      const nombreCompleto = p.nombre + ' ' + p.apellido;
      const matchSearch = !term || nombreCompleto.toLowerCase().includes(term) || p.dni.includes(term);
      const matchPos = !this.posicionFiltro || p.posicionCancha === this.posicionFiltro;
      return matchSearch && matchPos;
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

  verFicha(id: number) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarJugador(id: number) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }
}
