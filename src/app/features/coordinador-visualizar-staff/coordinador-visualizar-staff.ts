import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StaffService, Staff } from '../../core/services/staff.service';

@Component({
  selector: 'app-coordinador-visualizar-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-visualizar-staff.html',
  styleUrl: './coordinador-visualizar-staff.css'
})
export class CoordinadorVisualizarStaff implements OnInit {
  private staffService = inject(StaffService);
  userName = 'Rubén del Olmo';
  userEmail = 'Ejemplo@mailejemplo.com';

  activeTab = 'Staff';
  selectedRole = '';
  searchTerm = '';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, route: '/coordinador' },
    { label: 'Jugadores', icon: 'group', active: false, route: '/coordinador-lista-jugadores' },
    { label: 'Staff', icon: 'badge', active: true, route: '/coordinador/visualizar-staff' },
    { label: 'Categorias', icon: 'category', active: false, route: '/coordinador-seleccion-categorias' }
  ];

  staffList: Staff[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.staffService.getStaff().subscribe(data => this.staffList = data);
  }

  filterByRole(role: string) {
    this.selectedRole = this.selectedRole === role ? '' : role;
  }

  get filteredStaff(): Staff[] {
    return this.staffList.filter(s => {
      const matchRole = !this.selectedRole || s.rol === this.selectedRole;
      const nombreCompleto = s.nombre + ' ' + s.apellido;
      const matchSearch = !this.searchTerm || nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) || s.dni.includes(this.searchTerm);
      return matchRole && matchSearch;
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

  editarTrabajador(name: string) {
    console.log(`Editando trabajador: ${name}`);
  }

  verFicha(staffName: string) {
    this.router.navigate(['/coordinador/visualizar-perfil-staff'], {
      queryParams: { staff: staffName }
    });
  }
}
