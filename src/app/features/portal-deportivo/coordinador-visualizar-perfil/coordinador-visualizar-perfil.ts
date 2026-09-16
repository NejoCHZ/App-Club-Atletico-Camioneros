import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

interface MatchRecord {
  day: string;
  date: string;
  rival: string;
  result: string;
  minutes: string;
}

interface PlayerProfile {
  name: string;
  position: string;
  birthdate: string;
  age: string;
  weight: string;
  height: string;
  preferredFoot: string;
  bloodType: string;
  tutor: string;
  phone: string;
  address: string;
  pathologies: string;
  lesions: string;
  medicalNotes: string;
}

@Component({
  selector: 'app-coordinador-visualizar-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coordinador-visualizar-perfil.html',
  styleUrl: './coordinador-visualizar-perfil.css'
})
export class CoordinadorVisualizarPerfil implements OnInit {
  
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  // Base de datos simulada para mapear los perfiles según el jugador seleccionado
  playersDatabase: { [key: string]: PlayerProfile } = {};

  player: PlayerProfile = this.playersDatabase['JUAN PÉREZ'];

  // Historial ampliado de partidos
  matches: MatchRecord[] = [
    { day: '1', date: '12/03', rival: 'TALLERES', result: '2 - 1', minutes: '90’' },
    { day: '2', date: '19/03', rival: 'BELGRANO', result: '1 - 1', minutes: '90’' },
    { day: '3', date: '26/03', rival: 'INSTITUTO', result: '3 - 0', minutes: '90’' },
    { day: '4', date: '02/04', rival: 'RACING', result: '0 - 0', minutes: '75’' },
    { day: '5', date: '09/04', rival: 'AT. TUCUMÁN', result: '2 - 0', minutes: '90’' },
    { day: '6', date: '16/04', rival: 'RIVER PLATE', result: '1 - 2', minutes: '90’' },
    { day: '7', date: '23/04', rival: 'BOCA JUNIORS', result: '2 - 2', minutes: '90’' },
    { day: '14', date: '11/06', rival: 'TIGRE', result: '0 - 2', minutes: '90’' },
    { day: '15', date: '18/06', rival: 'COLÓN', result: '1 - 0', minutes: '90’' },
    { day: '16', date: '25/06', rival: 'UNIÓN', result: '2 - 2', minutes: '90’' },
    { day: '17', date: '02/07', rival: 'GIMNASIA', result: '1 - 1', minutes: '90’' },
    { day: '8', date: '30/04', rival: 'SAN LORENZO', result: '1 - 0', minutes: '60’' }
  ];

  totalMinutes = '725’';

  activeTab = 'Jugadores';
  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-seleccion-categorias' },
    { label: 'Staff', icon: 'badge', active: false, route: '#' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['player']) {
        const playerName = params['player'].toUpperCase();
        if (this.playersDatabase[playerName]) {
          this.player = this.playersDatabase[playerName];
        } else {
          // Si el jugador viene de otra pantalla sin datos predefinidos, creamos una estructura base
          this.player = {
            ...this.player,
            name: playerName,
            position: ' JUGADOR'
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

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }
}
