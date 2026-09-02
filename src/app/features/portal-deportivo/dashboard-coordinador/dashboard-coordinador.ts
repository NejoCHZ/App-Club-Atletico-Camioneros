import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface KpiData {
  title: string;
  value: string | number;
  icon: string;
}

interface Registration {
  name: string;
  club: string;
  category: string;
  date: string;
  avatarColor?: string;
}

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-dashboard-coordinador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-coordinador.html',
  styleUrl: './dashboard-coordinador.css'
})
export class DashboardCoordinador implements OnInit {

  // Simulated User Data
  userName = 'Rubén Del Olmo';
  userRole = 'CACC';

  // Simulated KPI Data
  kpis: KpiData[] = [
    { title: 'Total de Jugadores', value: '+500', icon: 'users' },
    { title: 'Categorías Activas', value: '+16', icon: 'flag' }
  ];

  // Simulated Registrations Data
  recentRegistrations: Registration[] = [
    { name: 'Juan Pérez', club: 'CACC', category: 'Categoría 2009', date: '23/07/2023' },
    { name: 'Juan Padela', club: 'CACC', category: 'Categoría 2004', date: '23/07/2023' },
    { name: 'Laura González', club: 'CACC', category: 'Categoría 2012', date: '24/07/2023' },
    { name: 'Pedro Sánchez', club: 'CACC', category: 'Categoría 2010', date: '24/07/2023' },
    { name: 'Tomas Degani', club: 'CACC', category: 'Categoría 2009', date: '24/07/2023' },
    { name: 'Landro Parcelas', club: 'CACC', category: 'Categoría 2009', date: '24/07/2023' },
    { name: 'Luciana Santillán', club: 'CACC', category: 'Categoría 2009', date: '24/07/2023' }
  ];

  // Simulated Distribution Data
  maxDistributionCount = 20;
  categoryDistributions: CategoryDistribution[] = [
    { category: 'Categoría 2009', count: 19, percentage: 0 },
    { category: 'Categoría 2008', count: 10, percentage: 0 },
    { category: 'Categoría 2004', count: 6, percentage: 0 },
    { category: 'Categoría 2010', count: 3, percentage: 0 },
    { category: 'Categoría 2012', count: 2, percentage: 0 },
    { category: 'Categoría 2006', count: 2, percentage: 0 },
    { category: 'Categoría 2007', count: 1, percentage: 0 },
    { category: 'Categoría 2003', count: 6, percentage: 0 }
  ];

  constructor() { }

  ngOnInit(): void {
    // Calculamos los porcentajes dinámicos para las barras
    this.categoryDistributions = this.categoryDistributions.map(dist => ({
      ...dist,
      percentage: (dist.count / this.maxDistributionCount) * 100
    }));
  }
}
