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

  recentRegistrations = [
    { name: 'Mateo Messi', club: 'CACC', category: '2015', date: 'Hoy' },
    { name: 'Ciro Messi', club: 'CACC', category: '2018', date: 'Ayer' }
  ];

  categoryDistributions = [
    { name: '2015', count: 120, percentage: 80 },
    { name: '2016', count: 90, percentage: 60 }
  ];

  navItems = [
    { label: 'Inicio', icon: 'home', active: true, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' }
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
