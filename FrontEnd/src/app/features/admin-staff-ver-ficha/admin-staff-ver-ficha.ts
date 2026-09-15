import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-admin-staff-ver-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-staff-ver-ficha.html',
  styleUrl: './admin-staff-ver-ficha.css',
})
export class AdminStaffVerFicha implements OnInit {
  staffId = 1;
  mostrarPopupCredencial = false;

  nombreCompleto = 'NOMBRE Y APELLIDO';
  rol = 'ROL';

  fechaNacimiento = 'DD/MM/AAAA';
  edad = '00 Años';
  grupoSanguineo = '0 +';
  telefonoTutor = '0000000000';
  domicilio = 'Calle falsa 123';

  activeTab = 'Staff';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.staffId = Number(idParam);
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
    this.router.navigate(['/admin/staff']);
  }

  editarPerfil() {
    this.router.navigate(['/admin/staff/editar-ficha', this.staffId]);
  }

  generarCredencial() {
    this.mostrarPopupCredencial = true;
  }

  descargarCredencial() {
    alert('Descargando credencial de ' + this.nombreCompleto + '...');
  }
}
