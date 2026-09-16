import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

@Component({
  selector: 'app-coordinador-visualizar-plantel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-visualizar-plantel.html',
  styleUrl: './coordinador-visualizar-plantel.css'
})
export class CoordinadorVisualizarPlantel implements OnInit {
  private jugadorService = inject(JugadorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';
  categoryName = 'CATEGORÍA 2009';
  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  selectedPosition = '';
  searchTerm = '';

  players: Jugador[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['cat']) {
        this.categoryName = params['cat'];
      }
      this.cargarJugadores();
    });
  }

  cargarJugadores() {
    this.jugadorService.getJugadores(this.categoryName).subscribe({
      next: (data) => {
        this.players = data;
      },
      error: (err) => {
        console.error('Error al cargar jugadores de la API', err);
        this.players = [];
      }
    });
  }

  get filteredPlayers() {
    return this.players.filter(p => {
      const matchPos = !this.selectedPosition || p.posicionCancha === this.selectedPosition;
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      const matchSearch = !this.searchTerm || nombreCompleto.includes(this.searchTerm.toLowerCase());
      return matchPos && matchSearch;
    });
  }

  filterByPosition(pos: string) {
    this.selectedPosition = this.selectedPosition === pos ? '' : pos;
  }

  verFicha(jugador: Jugador) {
    this.router.navigate(['/coordinador/visualizar-perfil'], {
      queryParams: { player: `${jugador.nombre} ${jugador.apellido}` }
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

  calcularEdad(fecha: string): string {
    if (!fecha) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fecha);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad + ' años';
  }
}
