import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

export interface CategoriaSimple {
  idCategoria: number;
  nombreCategoria: string;
}

@Component({
  selector: 'app-admin-staff-editar-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-staff-editar-ficha.html',
  styleUrl: './admin-staff-editar-ficha.css'
})
export class AdminStaffEditarFicha implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);

  staffId: number = 0;
  isLoading: boolean = false;
  isSaving: boolean = false;
  mensajeExito: boolean = false;

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  menuUsuarioAbierto: boolean = false;
  sidebarOculto: boolean = false;
  activeTab: string = 'Staff';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: false },
    { label: 'Staff', icon: 'badge', active: true },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  // Matriz de 7 roles institucionales
  rolesDisponibles = [
    { id: 1, valor: 'ADMINISTRADOR', texto: 'Administrador' },
    { id: 2, valor: 'ADMINISTRATIVO', texto: 'Administrativo' },
    { id: 3, valor: 'MÉDICO', texto: 'Médico' },
    { id: 4, valor: 'DIRECTOR TÉCNICO', texto: 'Director Técnico' },
    { id: 5, valor: 'DON QR', texto: 'Don QR' },
    { id: 6, valor: 'PREPARADOR FÍSICO', texto: 'Preparador Físico' },
    { id: 7, valor: 'COORDINADOR', texto: 'Coordinador' }
  ];

  listaCategorias: CategoriaSimple[] = [];
  categoriaSeleccionadaId: number | null = null;

  // Campos de formulario
  dni = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  edadCalculada = 'Sin edad';
  rol = '';
  idRol: number = 4;
  domicilio = '';
  email = '';
  password = '';
  activo: boolean = true;

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarCategorias();

    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.staffId = Number(idParam);
        this.cargarDatosStaff(this.staffId);
      }
    });
  }

  limpiarNombreRol(rol: string): string {
    if (!rol) return '';
    let r = rol.replace(/\s*\([^)]*\)/gi, '').trim();
    if (r.toLowerCase() === 'tesorero') {
      r = 'Administrador';
    }
    return r;
  }

  private cargarUsuario(): void {
    const token = this.authService.getToken();
    const rol = this.authService.getRol() || 'Administrador';

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
          || payload.email
          || '';

        this.usuarioActual = {
          nombre: this.limpiarNombreRol(rol),
          email: email
        };
      } catch {
        this.usuarioActual = { nombre: this.limpiarNombreRol(rol), email: '' };
      }
    }
  }

  private cargarCategorias(): void {
    this.http.get<any[]>('http://localhost:5191/api/categorias').subscribe({
      next: (data) => {
        this.listaCategorias = data.map(c => ({
          idCategoria: c.idCategoria || c.PK_id_categoria,
          nombreCategoria: c.nombreCategoria || c.nombre_categoria
        }));
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  private cargarDatosStaff(id: number): void {
    this.isLoading = true;
    this.http.get<any>(`http://localhost:5191/api/staff/${id}`).subscribe({
      next: (s) => {
        this.isLoading = false;
        this.nombre = s.nombre || '';
        this.apellido = s.apellido || '';
        this.dni = s.dni || '';
        this.domicilio = s.domicilio || '';
        this.email = s.email || '';
        this.idRol = s.idRol || 4;
        this.activo = s.activo !== undefined ? s.activo : true;

        const rolObj = this.rolesDisponibles.find(r => r.id === this.idRol);
        this.rol = rolObj ? rolObj.valor : 'DIRECTOR TÉCNICO';

        this.categoriaSeleccionadaId = s.idCategoriaAsignada || null;

        if (s.fechaDeNacimiento) {
          const date = new Date(s.fechaDeNacimiento);
          const d = String(date.getDate()).padStart(2, '0');
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = date.getFullYear();
          this.fechaNacimiento = `${d}/${m}/${y}`;
          this.calcularEdad(date);
        } else {
          this.fechaNacimiento = '';
          this.edadCalculada = 'Sin edad';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar la ficha del staff:', err);
        alert('No se pudo encontrar al colaborador solicitado.');
        this.cancelar();
      }
    });
  }

  requiereCategoria(): boolean {
    const r = (this.rol || '').toUpperCase();
    return r === 'DIRECTOR TÉCNICO' || r === 'PREPARADOR FÍSICO';
  }

  onRolChange(): void {
    const rolObj = this.rolesDisponibles.find(r => r.valor === this.rol);
    if (rolObj) {
      this.idRol = rolObj.id;
    }
    if (!this.requiereCategoria()) {
      this.categoriaSeleccionadaId = null;
    }
  }

  onFechaNacimientoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputEvent = event as InputEvent;

    let raw = input.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);

    let formatted = '';
    if (raw.length > 0) formatted = raw.substring(0, 2);
    if (raw.length > 2) formatted += '/' + raw.substring(2, 4);
    if (raw.length > 4) formatted += '/' + raw.substring(4, 8);

    if (inputEvent && inputEvent.inputType === 'deleteContentBackward') {
      if (input.value.endsWith('/')) {
        formatted = input.value.slice(0, -1);
      }
    }

    this.fechaNacimiento = formatted;
    input.value = formatted;

    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      this.calcularEdad(d);
    } else {
      this.edadCalculada = 'Sin edad';
    }
  }

  private calcularEdad(birthDate: Date): void {
    const hoy = new Date();
    let edad = hoy.getFullYear() - birthDate.getFullYear();
    const m = hoy.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < birthDate.getDate())) {
      edad--;
    }
    this.edadCalculada = edad > 0 ? `${edad} AÑOS` : 'Sin edad';
  }

  guardar(): void {
    if (!this.dni || !this.nombre || !this.apellido || !this.fechaNacimiento || !this.rol || !this.email) {
      alert('Por favor complete los campos obligatorios (*).');
      return;
    }

    if (this.requiereCategoria() && !this.categoriaSeleccionadaId) {
      alert('Debe asignar una categoría deportiva obligatoria para el Director Técnico o Preparador Físico.');
      return;
    }

    let fechaIso: string | null = null;
    if (this.fechaNacimiento && this.fechaNacimiento.length === 10) {
      const parts = this.fechaNacimiento.split('/');
      if (parts.length === 3) {
        fechaIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const payload = {
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      dni: this.dni.replace(/\./g, '').trim(),
      fechaNacimiento: fechaIso,
      domicilio: this.domicilio.trim(),
      genero: 'No especificado',
      email: this.email.trim(),
      contrasenia: this.password ? this.password.trim() : null,
      idRol: this.idRol,
      rol: this.rol,
      idCategoria: this.categoriaSeleccionadaId,
      activo: this.activo
    };

    this.isSaving = true;
    this.http.put(`http://localhost:5191/api/staff/${this.staffId}`, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.mensajeExito = true;
        setTimeout(() => {
          this.router.navigate(['/admin/staff']);
        }, 1200);
      },
      error: (err) => {
        this.isSaving = false;
        if (err.status === 409) {
          alert('Conflicto: Ya existe otro registro con ese DNI o Email en el club.');
        } else {
          alert('Error al actualizar: ' + (err.error?.message || 'Error del servidor.'));
        }
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/staff']);
  }

  toggleSidebar(): void {
    this.sidebarOculto = !this.sidebarOculto;
  }

  toggleMenuUsuario(event: MouseEvent): void {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }

  @HostListener('document:click')
  cerrarMenus(): void {
    this.menuUsuarioAbierto = false;
  }

  irASeleccionPortales(): void {
    this.router.navigate(['/seleccion-portales']);
  }

  irAConfiguracion(): void {
    alert('Módulo de configuración de cuenta en desarrollo.');
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  selectNav(label: string): void {
    if (label === 'Inicio') {
      this.router.navigate(['/admin']);
    } else if (label === 'Jugadores') {
      this.router.navigate(['/admin/lista-jugadores']);
    } else if (label === 'Staff') {
      this.router.navigate(['/admin/staff']);
    } else if (label === 'Categorias' || label === 'Categorías') {
      this.router.navigate(['/admin/categorias']);
    }
  }
}
