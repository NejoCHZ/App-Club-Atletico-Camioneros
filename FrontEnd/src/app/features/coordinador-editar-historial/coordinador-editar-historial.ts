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

  playersDatabase: { [key: string]: PlayerFichaDetail } = {
    'JUAN PÉREZ': {
      nombreCompleto: 'JUAN PÉREZ',
      posicion: 'ARQUERO',
      fechaNacimiento: '15/05/2009',
      edad: '17 Años',
      peso: '68 Kg',
      altura: '1.78 m',
      pieHabil: 'Derecho',
      grupoSanguineo: 'O +',
      tutor: 'Carlos Pérez',
      telefonoTutor: '3512345678',
      domicilio: 'Calle Falsa 123',
      totalMinutosJugados: "725'",
      patologias: 'Sin patologías conocidas.',
      lesiones: ['Esguince de tobillo (2025)', 'Sobrecarga muscular (2026)'],
      observacionesMedicas: 'Apto médico físico y cardiológico al día.',
      historialPartidos: Array.from({ length: 20 }, (_, i) => ({
        dia: 'DD/MM',
        fecha: `${i + 1}`,
        rival: 'NOMBRE RIVAL',
        golesLocal: '00',
        golesVisita: '00',
        minutos: "00'"
      }))
    },
    'JUAN PADELA': {
      nombreCompleto: 'JUAN PADELA',
      posicion: 'DEFENSOR',
      fechaNacimiento: '22/08/2006',
      edad: '19 Años',
      peso: '74 Kg',
      altura: '1.82 m',
      pieHabil: 'Izquierdo',
      grupoSanguineo: 'A +',
      tutor: 'Mario Padela',
      telefonoTutor: '3519876543',
      domicilio: 'Av. Sabattini 4500',
      totalMinutosJugados: "640'",
      patologias: 'Asma leve controlada.',
      lesiones: ['Contractura en cuádriceps (2025)'],
      observacionesMedicas: 'Uso de inhalador previo a exigencia física alta.',
      historialPartidos: Array.from({ length: 20 }, (_, i) => ({
        dia: 'DD/MM',
        fecha: `${i + 1}`,
        rival: 'NOMBRE RIVAL',
        golesLocal: '00',
        golesVisita: '00',
        minutos: "00'"
      }))
    },
    'LAURA GONZÁLEZ': {
      nombreCompleto: 'LAURA GONZÁLEZ',
      posicion: 'VOLANTE',
      fechaNacimiento: '10/11/2012',
      edad: '14 Años',
      peso: '55 Kg',
      altura: '1.62 m',
      pieHabil: 'Derecho',
      grupoSanguineo: 'B +',
      tutor: 'Sofía González',
      telefonoTutor: '3515554433',
      domicilio: 'San Jerónimo 850',
      totalMinutosJugados: "810'",
      patologias: 'Ninguna.',
      lesiones: ['Sin lesiones registradas.'],
      observacionesMedicas: 'Apto médico escolar y deportivo vigente.',
      historialPartidos: Array.from({ length: 20 }, (_, i) => ({
        dia: 'DD/MM',
        fecha: `${i + 1}`,
        rival: 'NOMBRE RIVAL',
        golesLocal: '00',
        golesVisita: '00',
        minutos: "00'"
      }))
    },
    'PEDRO SÁNCHEZ': {
      nombreCompleto: 'PEDRO SÁNCHEZ',
      posicion: 'DELANTERO',
      fechaNacimiento: '03/02/2010',
      edad: '16 Años',
      peso: '65 Kg',
      altura: '1.75 m',
      pieHabil: 'Derecho',
      grupoSanguineo: '0 -',
      tutor: 'Esteban Sánchez',
      telefonoTutor: '3513332211',
      domicilio: 'Rincón 332',
      totalMinutosJugados: "590'",
      patologias: 'Ninguna.',
      lesiones: ['Rotura fibrilar isquiotibial (2025)'],
      observacionesMedicas: 'Rehabilitación completa finalizada exitosamente.',
      historialPartidos: Array.from({ length: 20 }, (_, i) => ({
        dia: 'DD/MM',
        fecha: `${i + 1}`,
        rival: 'NOMBRE RIVAL',
        golesLocal: '00',
        golesVisita: '00',
        minutos: "00'"
      }))
    }
  };

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
