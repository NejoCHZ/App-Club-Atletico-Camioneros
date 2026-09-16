import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JugadorService } from '../../core/services/jugador.service';
import { Jugador } from '../../core/models/jugador.model';

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

export interface Player extends Jugador {
  estadoCuota?: 'COMPLETO' | 'PENDIENTE' | 'ADEUDA';
  ficha: FichaMedica;
}

@Component({
  selector: 'app-medico-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medico-home.component.html',
  styleUrl: './medico-home.component.css'
})
export class MedicoHomeComponent implements OnInit {
  private jugadorService = inject(JugadorService);
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
      value: '',
      type: 'jugadores',
      icon: 'users'
    },
    {
      title: 'Aptos Físicos Vigentes',
      value: '',
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

  players: Player[] = [];

  ngOnInit() {
    this.jugadorService.getJugadores().subscribe(data => {
      this.players = data.map(j => ({
        ...j,
        ficha: {
          obraSocial: '', nroAfiliado: '', grupoSanguineo: '', aptoFisicoVencimiento: '',
          aptoEstado: 'COMPLETO', alergias: '', patologias: '', medicacion: '',
          contactoEmergencia: '', observaciones: ''
        }
      }));
    });
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
  }

  viewFicha(player: Player) {
    this.selectedPlayer = player;
    this.editableFicha = JSON.parse(JSON.stringify(player.ficha));
    this.isModalOpen = true;
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
