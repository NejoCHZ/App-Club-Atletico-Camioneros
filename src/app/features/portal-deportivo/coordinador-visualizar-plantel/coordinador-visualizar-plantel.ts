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
  selectedPosition = 'TODOS';
  searchTerm = '';

  players = [
    { name: 'Juan Perez', dni: '12345678', position: 'ARQUERO', age: '14 años' },
    { name: 'Luis Gomez', dni: '87654321', position: 'DEFENSOR', age: '15 años' },
    { name: 'Carlos Ruiz', dni: '11223344', position: 'VOLANTE', age: '14 años' },
    { name: 'Mario Diaz', dni: '44332211', position: 'DELANTERO', age: '15 años' }
  ];

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['cat']) {
        this.categoryName = params['cat'];
      }
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

  get filteredPlayers() {
    return this.players.filter(p => {
      const matchPos = this.selectedPosition === 'TODOS' || p.position === this.selectedPosition;
      const matchSearch = p.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchPos && matchSearch;
    });
  }

  filterByPosition(pos: string) {
    if (this.selectedPosition === pos) {
      this.selectedPosition = 'TODOS';
    } else {
      this.selectedPosition = pos;
    }
  }

  verFicha(name: string) {
    console.log('Ver ficha de', name);
  }
}
