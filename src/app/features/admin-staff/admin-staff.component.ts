import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export interface StaffMember {
  id: number;
  nombreCompleto: string;
  dni: string;
  rol: 'DIRECTOR TÉCNICO' | 'PREPARADOR FÍSICO' | 'MÉDICO' | 'KINESIÓLOGO' | 'DELEGADO';
  edad: string;
  categoriaAsignada: string;
  telefono: string;
  estado: 'ACTIVO' | 'LICENCIA' | 'INACTIVO';
}

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-staff.component.html',
  styleUrl: './admin-staff.component.css'
})
export class AdminStaffComponent {
  searchTerm = '';
  rolFiltro = ''; // '' = Todos, 'DIRECTOR TÉCNICO', 'PREPARADOR FÍSICO'

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true }
  ];

  trabajadores: StaffMember[] = [
    {
      id: 1,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'DIRECTOR TÉCNICO',
      edad: '42 AÑOS',
      categoriaAsignada: 'JUVENIL',
      telefono: '351-4455667',
      estado: 'ACTIVO'
    },
    {
      id: 2,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'PREPARADOR FÍSICO',
      edad: '38 AÑOS',
      categoriaAsignada: 'INFANTIL',
      telefono: '351-9988776',
      estado: 'ACTIVO'
    },
    {
      id: 3,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'DIRECTOR TÉCNICO',
      edad: '45 AÑOS',
      categoriaAsignada: 'CEBOLLITAS',
      telefono: '351-7766554',
      estado: 'ACTIVO'
    },
    {
      id: 4,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'PREPARADOR FÍSICO',
      edad: '34 AÑOS',
      categoriaAsignada: 'TODAS',
      telefono: '351-3322110',
      estado: 'ACTIVO'
    },
    {
      id: 5,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'DIRECTOR TÉCNICO',
      edad: '50 AÑOS',
      categoriaAsignada: 'RESERVA',
      telefono: '351-6655443',
      estado: 'ACTIVO'
    },
    {
      id: 6,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'PREPARADOR FÍSICO',
      edad: '39 AÑOS',
      categoriaAsignada: 'PRIMERA',
      telefono: '351-1122334',
      estado: 'ACTIVO'
    }
  ];

  constructor(private router: Router) {}

  selectNav(label: string) {
    if (label === 'Inicio' || label === 'Jugadores') {
      this.router.navigate(['/admin']);
    }
  }

  volver() {
    this.router.navigate(['/admin']);
  }

  toggleRolFiltro(rol: string) {
    if (this.rolFiltro === rol) {
      this.rolFiltro = '';
    } else {
      this.rolFiltro = rol;
    }
  }

  get filteredStaff(): StaffMember[] {
    return this.trabajadores.filter(t => {
      const matchSearch = !this.searchTerm || 
        t.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        t.dni.includes(this.searchTerm);
      const matchRol = !this.rolFiltro || t.rol === this.rolFiltro;
      return matchSearch && matchRol;
    });
  }

  darDeAltaTrabajador() {
    this.router.navigate(['/admin/alta-trabajador']);
  }
}
