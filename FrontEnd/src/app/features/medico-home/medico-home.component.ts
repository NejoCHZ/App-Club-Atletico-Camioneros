import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export interface FichaMedica {
  obraSocial: string;
  nroAfiliado: string;
  grupoSanguineo: string;
  aptoFisicoVencimiento: string;
  aptoEstado: 'COMPLETO' | 'PENDIENTE' | 'ADEUDA';
  alergias: string;
  patologias: string;
  medicacion: string;
  contactoEmergencia: string;
  observaciones: string;
}

export interface Player {
  id: number;
  nombreCompleto: string;
  dni: string;
  categoria: string;
  fechaNacimiento: string;
  estadoCuota?: 'COMPLETO' | 'PENDIENTE' | 'ADEUDA';
  ficha: FichaMedica;
}

@Component({
  selector: 'app-medico-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medico-home.component.html',
  styleUrl: './medico-home.component.css'
})
export class MedicoHomeComponent {
  constructor(private router: Router) {}
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
      title: 'Aptos Físicos Vigentes',
      value: '95%',
      type: 'aptos',
      icon: 'heart'
    }
  ];

  selectedPlayer: Player | null = null;
  isModalOpen = false;

  editableFicha: FichaMedica = {
    obraSocial: '',
    nroAfiliado: '',
    grupoSanguineo: '',
    aptoFisicoVencimiento: '',
    aptoEstado: 'COMPLETO',
    alergias: '',
    patologias: '',
    medicacion: '',
    contactoEmergencia: '',
    observaciones: ''
  };

  players: Player[] = [
    {
      id: 1,
      nombreCompleto: 'LUIS OSCAR DIAZ',
      dni: '50.123.456',
      categoria: 'CEBOLLITAS',
      fechaNacimiento: '01/01/2019',
      ficha: {
        obraSocial: 'OSDE 210',
        nroAfiliado: '984123001',
        grupoSanguineo: 'O+',
        aptoFisicoVencimiento: '15/12/2026',
        aptoEstado: 'COMPLETO',
        alergias: 'Ninguna',
        patologias: 'Asma leve controlado',
        medicacion: 'Salbutamol s/n',
        contactoEmergencia: 'Padre: 351-5551234',
        observaciones: 'Apto cardiológico y ergometría sin observaciones.'
      }
    },
    {
      id: 2,
      nombreCompleto: 'NOMBRE COMPLETO',
      dni: '00.000.000',
      categoria: 'CATEGORIA',
      fechaNacimiento: '00/00/0000',
      ficha: {
        obraSocial: 'APROSS',
        nroAfiliado: '7721849',
        grupoSanguineo: 'A+',
        aptoFisicoVencimiento: '01/09/2026',
        aptoEstado: 'PENDIENTE',
        alergias: 'Penicilina',
        patologias: 'Ninguna',
        medicacion: 'Sin medicación crónica',
        contactoEmergencia: 'Madre: 351-4449876',
        observaciones: 'Falta actualizar electro de reposo.'
      }
    },
    {
      id: 3,
      nombreCompleto: 'NOMBRE COMPLETO',
      dni: '00.000.000',
      categoria: 'CATEGORIA',
      fechaNacimiento: '00/00/0000',
      ficha: {
        obraSocial: 'SWISS MEDICAL',
        nroAfiliado: '551029384',
        grupoSanguineo: 'B+',
        aptoFisicoVencimiento: '10/01/2026',
        aptoEstado: 'ADEUDA',
        alergias: 'Polen',
        patologias: 'Esguince tobillo recurrente',
        medicacion: 'Ninguna',
        contactoEmergencia: 'Tutor: 351-6663322',
        observaciones: 'Apto físico vencido, requiere nueva evaluación.'
      }
    }
  ];

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;

    if (label === 'Inicio') {
      this.router.navigate(['/medico']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/medico/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/medico/categorias']);
    }
  }

  viewFicha(player: Player) {
    this.router.navigate(['/medico/ficha-jugador', player.id]);
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPlayer = null;
  }

  saveFicha() {
    if (this.selectedPlayer) {
      this.selectedPlayer.ficha = { ...this.editableFicha };
      this.closeModal();
    }
  }
}
