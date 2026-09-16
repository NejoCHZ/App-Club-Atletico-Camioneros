import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface CategoryItem {
  name: string;
  playerCount: number;
}

@Component({
  selector: 'app-coordinador-seleccion-categorias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coordinador-seleccion-categorias.html',
  styleUrl: './coordinador-seleccion-categorias.css'
})
export class CoordinadorSeleccionCategorias implements OnInit {
  
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' }
  ];

  categories: CategoryItem[] = [
    { name: 'CATEGORÍA 2009', playerCount: 24 },
    { name: 'CATEGORÍA 2008', playerCount: 22 },
    { name: 'CATEGORÍA 2004', playerCount: 18 },
    { name: 'CATEGORÍA 2010', playerCount: 20 },
    { name: 'CATEGORÍA 2012', playerCount: 15 },
    { name: 'CATEGORÍA 2006', playerCount: 19 }
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

  onViewCategory(categoryName: string): void {
    this.router.navigate(['/coordinador/visualizar-plantel'], {
      queryParams: { cat: categoryName }
    });
  }
}
