import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface StaffItem {
  name: string;
  dni: string;
  role: string;
  age: string;
}

@Component({
  selector: 'app-coordinador-visualizar-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coordinador-visualizar-staff.html',
  styleUrl: './coordinador-visualizar-staff.css'
})
export class CoordinadorVisualizarStaff implements OnInit {
  
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

  staffList: StaffItem[] = [
    { name: 'ROBERTO GÓMEZ', dni: '32.456.789', role: 'DIRECTOR TÉCNICO', age: '45 AÑOS' },
    { name: 'MARCOS AVALOS', dni: '35.111.222', role: 'PREPARADOR FÍSICO', age: '38 AÑOS' },
    { name: 'ESTEBAN QUINTANA', dni: '28.999.888', role: 'DIRECTOR TÉCNICO', age: '50 AÑOS' },
    { name: 'LUCAS MAIDANA', dni: '38.444.555', role: 'PREPARADOR FÍSICO', age: '32 AÑOS' },
    { name: 'DANIEL BUSTOS', dni: '31.222.333', role: 'DIRECTOR TÉCNICO', age: '42 AÑOS' },
    { name: 'MATÍAS GIMÉNEZ', dni: '36.777.888', role: 'PREPARADOR FÍSICO', age: '35 AÑOS' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  filterByRole(role: string) {
    this.selectedRole = this.selectedRole === role ? '' : role;
  }

  get filteredStaff(): StaffItem[] {
    return this.staffList.filter(s => {
      const matchRole = !this.selectedRole || s.role === this.selectedRole;
      const matchSearch = !this.searchTerm || s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || s.dni.includes(this.searchTerm);
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
