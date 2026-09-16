import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { RecentRegistration, CategoryDistribution } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard-coordinador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-coordinador.html',
  styleUrl: './dashboard-coordinador.css'
})
export class DashboardCoordinador implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';
  totalPlayers = '0';
  activeCategoriesCount = '0';
  activeTab = 'Inicio';

  navItems = [
    { label: 'Inicio', icon: 'home', active: true, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  recentRegistrations: RecentRegistration[] = [];
  categoryDistributions: CategoryDistribution[] = [];

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.totalPlayers = stats.totalPlayers;
        this.activeCategoriesCount = stats.activeCategoriesCount;
        this.recentRegistrations = stats.recentRegistrations;
        this.categoryDistributions = stats.categoryDistributions;
      },
      error: (err) => {
        console.error('Error al cargar stats de la API', err);
        this.totalPlayers = '0';
        this.activeCategoriesCount = '0';
        this.recentRegistrations = [];
        this.categoryDistributions = [];
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
