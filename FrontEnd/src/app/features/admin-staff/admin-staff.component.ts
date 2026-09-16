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
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  trabajadores: StaffMember[] = [
    {
      id: 1,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'DIRECTOR TÉCNICO',
      edad: '00 AÑOS',
      categoriaAsignada: 'JUVENIL',
      telefono: '351-4455667',
      estado: 'ACTIVO'
    },
    {
      id: 2,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'PREPARADOR FÍSICO',
      edad: '00 AÑOS',
      categoriaAsignada: 'INFANTIL',
      telefono: '351-9988776',
      estado: 'ACTIVO'
    },
    {
      id: 3,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'DIRECTOR TÉCNICO',
      edad: '00 AÑOS',
      categoriaAsignada: 'CEBOLLITAS',
      telefono: '351-7766554',
      estado: 'ACTIVO'
    },
    {
      id: 4,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'PREPARADOR FÍSICO',
      edad: '00 AÑOS',
      categoriaAsignada: 'TODAS',
      telefono: '351-3322110',
      estado: 'ACTIVO'
    },
    {
      id: 5,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'DIRECTOR TÉCNICO',
      edad: '00 AÑOS',
      categoriaAsignada: 'RESERVA',
      telefono: '351-6655443',
      estado: 'ACTIVO'
    },
    {
      id: 6,
      nombreCompleto: 'NOMBRE Y APELLIDO',
      dni: '43.123.456',
      rol: 'PREPARADOR FÍSICO',
      edad: '00 AÑOS',
      categoriaAsignada: 'PRIMERA',
      telefono: '351-1122334',
      estado: 'ACTIVO'
    }
  ];

  constructor(private router: Router) {}

  selectNav(label: string) {
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

  editarTrabajador(id: number) {
    this.router.navigate(['/admin/staff/editar-ficha', id]);
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/staff/ver-ficha', id]);
  }
}
