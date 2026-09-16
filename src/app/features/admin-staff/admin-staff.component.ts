import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StaffService, Staff } from '../../core/services/staff.service';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-staff.component.html',
  styleUrl: './admin-staff.component.css'
})
export class AdminStaffComponent implements OnInit {
  private staffService = inject(StaffService);
  searchTerm = '';
  rolFiltro = ''; 

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  trabajadores: Staff[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.staffService.getStaff().subscribe(data => this.trabajadores = data);
  }

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

  get filteredStaff(): Staff[] {
    return this.trabajadores.filter(t => {
      const nombreCompleto = t.nombre + ' ' + t.apellido;
      const matchSearch = !this.searchTerm || 
        nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
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
