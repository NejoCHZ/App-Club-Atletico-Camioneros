import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

export interface PartidoEditable {
  dia: string;
  fecha: string;
  rival: string;
  golesLocal: string;
  golesVisita: string;
  minutos: string;
}

export interface PlayerFichaDetail {
  nombreCompleto: string;
  posicion: string;
  fechaNacimiento: string;
  edad: string;
  peso: string;
  altura: string;
  pieHabil: string;
  grupoSanguineo: string;
  tutor: string;
  telefonoTutor: string;
  domicilio: string;
  totalMinutosJugados: string;
  patologias: string;
  lesiones: string[];
  observacionesMedicas: string;
  historialPartidos: PartidoEditable[];
}

@Component({
  selector: 'app-coordinador-editar-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-editar-historial.html',
  styleUrl: './coordinador-editar-historial.css'
})
export class CoordinadorEditarHistorial implements OnInit {
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  activeTab = 'Jugadores';
  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  playersDatabase: { [key: string]: PlayerFichaDetail } = {};

  player: PlayerFichaDetail = this.playersDatabase['JUAN PÉREZ'];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['player']) {
        const playerName = params['player'].toUpperCase();
        if (this.playersDatabase[playerName]) {
          this.player = this.playersDatabase[playerName];
        } else {
          this.player = {
            ...this.player,
            nombreCompleto: playerName
          };
        }
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

  cancelar() {
    this.router.navigate(['/coordinador/visualizar-perfil'], {
      queryParams: { player: this.player.nombreCompleto }
    });
  }

  guardar() {
    this.router.navigate(['/coordinador/visualizar-perfil'], {
      queryParams: { player: this.player.nombreCompleto }
    });
  }

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }
}
