import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

export interface PartidoEditable {
  dia: string;
  fecha: string;
  rival: string;
  golesFavor: string;
  golesContra: string;
  minutos: string;
}

@Component({
  selector: 'app-admin-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-editar-perfil.html',
  styleUrl: './admin-editar-perfil.css',
})
export class AdminEditarPerfil implements OnInit {
  playerId = 1;
  nombreCompleto = '';
  posicion = '';

  fechaNacimiento = '';
  edad = '';
  peso = '';
  altura = '';
  pieHabil = '';
  grupoSanguineo = '';
  tutor = '';
  telefonoTutor = '';
  domicilio = '';

  totalMinutosJugados = "00'";

  partidos: PartidoEditable[] = Array.from({ length: 20 }, () => ({
    dia: '',
    fecha: '',
    rival: '',
    golesFavor: '',
    golesContra: '',
    minutos: ''
  }));

  patologias = '';
  lesiones: string[] = ['Lesion 1', 'Lesion 2', 'Lesion 3'];
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

  agregarLesion() {
    const num = this.lesiones.length + 1;
    this.lesiones.push(`Lesion ${num}`);
  }

  editarLesion(index: number) {
    const val = prompt('Editar lesión:', this.lesiones[index]);
    if (val !== null && val.trim() !== '') {
      this.lesiones[index] = val.trim();
    }
  }

  eliminarLesion(index: number) {
    this.lesiones.splice(index, 1);
  }

  cancelar() {
    this.location.back();
  }

  guardar() {
    alert('Cambios guardados con éxito.');
    this.location.back();
  }
}
