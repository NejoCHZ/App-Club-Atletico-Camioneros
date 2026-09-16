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

  // Historial de partidos (copiado de admin-ficha-jugador: 20 registros)
  matches: MatchRecord[] = Array.from({ length: 20 }, (_, i) => ({
    day: 'DD/MM',
    date: `${i + 1}`,
    rival: 'NOMBRE RIVAL',
    result: '0 - 0',
    minutes: "00'"
  }));

  totalMinutes = "00'";

  activeTab = 'Jugadores';
  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: true, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: false, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
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

  getLesionsList(lesionsStr: string): string[] {
    if (!lesionsStr) return [];
    return lesionsStr.split('\n').map(l => l.replace(/^[•\-\s]+/, '').trim()).filter(l => l.length > 0);
  }

  editarHistorial() {
    this.router.navigate(['/coordinador/editar-historial'], {
      queryParams: { player: this.player.name }
    });
  }

  logout() {
    localStorage.removeItem('cacc_jwt_token');
    this.router.navigate(['/login']);
  }
}
