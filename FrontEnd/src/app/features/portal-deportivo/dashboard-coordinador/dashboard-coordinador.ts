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
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' }
  ];

  recentRegistrations = [
    { name: 'Juan Pérez', club: 'Camioneros Sub-15', category: '2009', date: '08/09/2026' },
    { name: 'Gonzalo Fernández', club: 'Camioneros Sub-13', category: '2011', date: '07/09/2026' },
    { name: 'Matías Silva', club: 'Camioneros Sub-17', category: '2007', date: '06/09/2026' }
  ];

  categoryDistributions = [
    { name: '2009', percentage: 75, count: 45 },
    { name: '2010', percentage: 60, count: 36 },
    { name: '2011', percentage: 85, count: 51 }
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
