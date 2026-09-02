import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

export interface PartidoItem {
  dia: string;
  fecha: number;
  rival: string;
  resultado: string;
  minutos: string;
}

@Component({
  selector: 'app-admin-ficha-jugador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-ficha-jugador.html',
  styleUrl: './admin-ficha-jugador.css',
})
export class AdminFichaJugador implements OnInit {
  playerId = 1;
  mostrarPopupCredencial = false;
  nombreCompleto = 'NOMBRE Y APELLIDO';
  posicion = 'POSICION';

  fechaNacimiento = 'DD/MM/AAAA';
  edad = '00 Años';
  peso = '00 Kg';
  altura = '0.00 m';
  pieHabil = 'Derecho';
  grupoSanguineo = '0 +';
  tutor = 'Nombre y apellido';
  telefonoTutor = '0000000000';
  domicilio = 'Calle falsa 123';

  totalMinutosJugados = "00'";

  partidos: PartidoItem[] = Array.from({ length: 20 }, (_, i) => ({
    dia: 'DD/MM',
    fecha: i + 1,
    rival: 'NOMBRE RIVAL',
    resultado: '0 - 0',
    minutos: "00'"
  }));

  patologias = '';
  lesiones: string[] = ['Lesion 1', 'Lesion 2', 'Lesion 3', '.', '.', '.'];
  observacionesMedicas = '';

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.playerId = Number(idParam);
      }
    });
  }

  selectNav(label: string) {
    this.navItems.forEach(item => item.active = (item.label === label));
    this.activeTab = label;
    if (label === 'Inicio') {
      this.router.navigate(['/admin']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    }
  }

  volver() {
    this.location.back();
  }

  editarPerfil() {
    this.router.navigate(['/admin/editar-perfil', this.playerId]);
  }

  generarCredencial() {
    this.mostrarPopupCredencial = true;
  }

  descargarCredencial() {
    alert('Descargando credencial de ' + this.nombreCompleto + '...');
  }
}
