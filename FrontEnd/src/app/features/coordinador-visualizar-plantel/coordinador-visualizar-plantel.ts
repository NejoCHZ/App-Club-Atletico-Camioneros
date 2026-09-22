import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coordinador-visualizar-plantel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-visualizar-plantel.html',
  styleUrl: './coordinador-visualizar-plantel.css'
})
export class CoordinadorVisualizarPlantel implements OnInit {
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

  players = [
    { name: 'Juan Pérez', dni: '45.123.456', position: 'ARQUERO', age: '15 años' },
    { name: 'Mateo Gómez', dni: '46.789.012', position: 'DEFENSOR', age: '15 años' },
    { name: 'Lucas Fernández', dni: '45.987.654', position: 'VOLANTE', age: '15 años' },
    { name: 'Santiago Rodríguez', dni: '46.321.654', position: 'DELANTERO', age: '15 años' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['cat']) {
        this.categoryName = params['cat'];
      }
    });
  }

  get filteredPlayers() {
    return this.players.filter(p => {
      const matchPos = !this.selectedPosition || p.position === this.selectedPosition;
      const matchSearch = !this.searchTerm || p.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchPos && matchSearch;
    });
  }

  filterByPosition(pos: string) {
    this.selectedPosition = this.selectedPosition === pos ? '' : pos;
  }

  verFicha(name: string) {
    this.router.navigate(['/coordinador/visualizar-perfil'], {
      queryParams: { player: name }
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
}
