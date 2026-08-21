import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  fechaNacimiento: string;
  estadoCuota: 'COMPLETO' | 'PENDIENTE' | 'ADEUDA';
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent {
  searchTerm = '';
  categoriaFiltro = '';
  ordenFiltro = '';

  activeTab = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: false }
  ];

  kpiCards = [
    {
      title: 'Total de Jugadores',
      value: '+500',
      type: 'jugadores',
      icon: 'users'
    },
    {
      title: 'Categorias Activas',
      value: '+16',
      type: 'categorias',
      icon: 'flag'
    },
    {
      title: 'Cuotas al Día',
      value: '95%',
      type: 'cuotas',
      icon: 'thumbs-up'
    }
  ];

  players: Player[] = [
    {
      id: 1,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019',
      estadoCuota: 'COMPLETO'
    },
    {
      id: 2,
      nombreCompleto: 'NOMBRE COMPLETO',
      dni: '00.000.000',
      categoria: 'CATEGORIA',
      fechaNacimiento: '00/00/0000',
      estadoCuota: 'PENDIENTE'
    },
    {
      id: 3,
      nombreCompleto: 'NOMBRE COMPLETO',
      dni: '00.000.000',
      categoria: 'CATEGORIA',
      fechaNacimiento: '00/00/0000',
      estadoCuota: 'ADEUDA'
    },
    {
      id: 4,
      nombreCompleto: 'CARLOS GUTIERREZ',
      dni: '48.912.344',
      categoria: 'INFANTIL',
      fechaNacimiento: '14/05/2017',
      estadoCuota: 'COMPLETO'
    },
    {
      id: 5,
      nombreCompleto: 'MATEO BENITEZ',
      dni: '52.331.009',
      categoria: 'JUVENIL',
      fechaNacimiento: '22/10/2015',
      estadoCuota: 'PENDIENTE'
    }
  ];

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
  }

  getBadgeClass(estado: Player['estadoCuota']): string {
    switch (estado) {
      case 'COMPLETO': return 'badge-completo';
      case 'PENDIENTE': return 'badge-pendiente';
      case 'ADEUDA': return 'badge-adeuda';
      default: return '';
    }
  }
}
