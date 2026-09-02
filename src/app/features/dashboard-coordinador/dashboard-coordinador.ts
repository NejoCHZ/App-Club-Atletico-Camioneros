import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-coordinador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-coordinador.html',
  styleUrl: './dashboard-coordinador.css'
})
export class DashboardCoordinador implements OnInit {
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';
  totalPlayers = '+500';
  activeCategoriesCount = '+25';
  activeTab = 'Inicio';

  navItems = [
    { label: 'Inicio', icon: 'home', active: true, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  recentRegistrations = [
    { name: 'Juan Pérez', club: 'CACC', category: 'Categoría 2009', date: '01/09/2026' },
    { name: 'Mateo Gómez', club: 'CACC', category: 'Categoría 2010', date: '31/08/2026' },
    { name: 'Lucas Fernández', club: 'CACC', category: 'Categoría 2008', date: '30/08/2026' }
  ];

  categoryDistributions = [
    { name: 'Cat 2008', count: 35, percentage: 70 },
    { name: 'Cat 2009', count: 42, percentage: 84 },
    { name: 'Cat 2010', count: 28, percentage: 56 },
    { name: 'Cat 2011', count: 30, percentage: 60 }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

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
