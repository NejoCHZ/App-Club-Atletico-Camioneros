import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-staff-editar-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-staff-editar-ficha.html',
  styleUrl: './admin-staff-editar-ficha.css',
})
export class AdminStaffEditarFicha implements OnInit {
  staffId = 1;

  nombreCompleto = '';
  rol = '';

  fechaNacimiento = '';
  edad = '';
  grupoSanguineo = '';
  telefonoTutor = '';
  domicilio = '';

  activeTab = 'Staff';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
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

  cancelar() {
    this.location.back();
  }

  guardar() {
    alert('Ficha de trabajador guardada con éxito.');
    this.location.back();
  }
}
