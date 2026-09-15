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
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' }
  ];

  selectedPosition = '';
  searchTerm = '';

  players = [
    { name: 'Mateo González', dni: '45.123.456', position: 'Arquero', age: '15 Años' },
    { name: 'Lucas Rodríguez', dni: '45.234.567', position: 'Defensor', age: '15 Años' },
    { name: 'Joaquín Benítez', dni: '45.345.678', position: 'Volante', age: '15 Años' },
    { name: 'Santiago López', dni: '45.456.789', position: 'Delantero', age: '15 Años' }
  ];

  get filteredPlayers() {
    return this.players.filter(p => {
      const matchPos = !this.selectedPosition || p.position.toUpperCase() === this.selectedPosition;
      const matchSearch = !this.searchTerm || p.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchPos && matchSearch;
    });
  }

  filterByPosition(pos: string) {
    this.selectedPosition = this.selectedPosition === pos ? '' : pos;
  }

  verFicha(name: string) {
    console.log('Ver ficha de', name);
  }

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
}
