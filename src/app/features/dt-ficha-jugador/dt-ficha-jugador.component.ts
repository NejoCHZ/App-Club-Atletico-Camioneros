import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface PartidoHistorial {
  dia: string;
  fecha: number;
  rival: string;
  resultado: string;
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
  historialPartidos: PartidoHistorial[];
  totalMinutosJugados: string;
  patologias: string;
  lesiones: string[];
  observacionesMedicas: string;
}

@Component({
  selector: 'app-dt-ficha-jugador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dt-ficha-jugador.component.html',
  styleUrl: './dt-ficha-jugador.component.css'
})
export class DtFichaJugadorComponent {
  navItems = [
    { label: 'Plantel', icon: 'plantel', active: false },
    { label: 'Estadísticas', icon: 'estadisticas', active: false },
    { label: 'Configuración', icon: 'configuracion', active: false }
  ];

  player: PlayerFichaDetail = {
    nombreCompleto: 'LUIS OSCAR DIAZ',
    posicion: 'DELANTERO CENTRO',
    fechaNacimiento: '14/05/2012',
    edad: '14 Años',
    peso: '58 Kg',
    altura: '1.68 m',
    pieHabil: 'Derecho',
    grupoSanguineo: 'O +',
    tutor: 'Jorge Oscar Diaz',
    telefonoTutor: '351-5551234',
    domicilio: 'Av. Colón 1420, Córdoba',
    totalMinutosJugados: "1240'",
    patologias: 'Sin patologías crónicas declaradas. Apto físico vigente presentado al inicio de temporada.',
    lesiones: [
      'Esguince leve tobillo derecho (Marzo 2025)',
      'Contusión en cuadriceps (Julio 2025)',
      'Sin lesiones activas al día de la fecha'
    ],
    observacionesMedicas: 'Evaluación ergométrica y electro de reposo sin alteraciones. Apto para alto rendimiento deportivo.',
    historialPartidos: [
      { dia: '12/03', fecha: 1, rival: 'BELGRANO', resultado: '2 - 1', minutos: "80'" },
      { dia: '19/03', fecha: 2, rival: 'TALLERES', resultado: '1 - 1', minutos: "80'" },
      { dia: '26/03', fecha: 3, rival: 'INSTITUTO', resultado: '3 - 0', minutos: "75'" },
      { dia: '02/04', fecha: 4, rival: 'RACING DE CÓRDOBA', resultado: '0 - 1', minutos: "80'" },
      { dia: '09/04', fecha: 5, rival: 'ESTUDIANTES R4', resultado: '2 - 0', minutos: "80'" },
      { dia: '16/04', fecha: 6, rival: 'ARGENTINO PEÑAROL', resultado: '4 - 1', minutos: "60'" },
      { dia: '23/04', fecha: 7, rival: 'GENERAL PAZ JUNIORS', resultado: '1 - 0', minutos: "80'" },
      { dia: '30/04', fecha: 8, rival: 'LAS PALMAS', resultado: '2 - 2', minutos: "80'" },
      { dia: '07/05', fecha: 9, rival: 'UNIVERSITARIO', resultado: '3 - 1', minutos: "70'" },
      { dia: '14/05', fecha: 10, rival: 'BARRIO PARQUE', resultado: '1 - 0', minutos: "80'" },
      { dia: '21/05', fecha: 11, rival: 'ATLETICO CARLOS PAZ', resultado: '0 - 0', minutos: "80'" },
      { dia: '28/05', fecha: 12, rival: 'CAMIONEROS A', resultado: '2 - 1', minutos: "80'" },
      { dia: '04/06', fecha: 13, rival: 'UNION SAN VICENTE', resultado: '3 - 0', minutos: "65'" },
      { dia: '11/06', fecha: 14, rival: 'VILLA AZALAIS', resultado: '1 - 0', minutos: "80'" },
      { dia: '18/06', fecha: 15, rival: 'AMERICA DE RIO IV', resultado: '2 - 0', minutos: "80'" }
    ]
  };

  constructor(private router: Router) {}

  volverAlPlantel() {
    this.router.navigate(['/dt']);
  }

  selectNav(label: string) {
    if (label === 'Plantel') {
      this.router.navigate(['/dt']);
    }
  }
}
