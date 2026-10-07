import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JugadorService } from '../../shared/services/jugador.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-editar-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-editar-perfil.html',
  styleUrl: './admin-editar-perfil.css'
})
export class AdminEditarPerfil implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jugadorService = inject(JugadorService);
  private readonly authService = inject(AuthService);

  jugadorId = '';
  cargando = true;
  guardando = false;
  errorCarga = '';

  usuarioActual = {
    nombre: 'Cargando...',
    email: '...'
  };

  menuUsuarioAbierto = false;
  sidebarOculto = false;
  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  perfil: any = {};
  lesiones: string[] = [];
  nuevaLesion = '';
  usarFechaHoy = true;

  posiciones = ['ARQUERO', 'DEFENSOR', 'VOLANTE', 'DELANTERO'];
  pies = ['Derecho', 'Izquierdo', 'Ambidiestro'];
  gruposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.volver();
      return;
    }
    this.jugadorId = id;
    this.cargarUsuario();
    this.cargarDatos();
  }

  private cargarUsuario(): void {
    const token = this.authService.getToken();
    const rol = this.authService.getRol() || 'Tesorero';

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email || '';
        this.usuarioActual = { nombre: rol, email: email };
      } catch {
        this.usuarioActual = { nombre: rol, email: '' };
      }
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.jugadorService.obtenerPorId(this.jugadorId).subscribe({
      next: (data: any) => {
        const fechaRaw = data.fechaDeNacimiento || data.FechaDeNacimiento || '';
        const fechaCorta = fechaRaw ? fechaRaw.split('T')[0] : '';

        this.perfil = {
          id: data.idJugador || data.IdJugador,
          nombre: data.nombre || data.Nombre,
          apellido: data.apellido || data.Apellido,
          dni: data.dni || data.Dni,
          genero: data.genero || data.Genero || 'Masculino',
          fechaNacimiento: fechaCorta,
          posicion: data.posicionCancha || data.PosicionCancha,
          idCategoria: data.idCategoria || data.IdCategoria || 0,
          categoria: data.nombreCategoria || data.NombreCategoria,
          clubOrigen: data.clubOrigen || data.ClubOrigen || 'Club Local',
          peso: data.peso || data.Peso,
          altura: data.altura || data.Altura,
          pieHabil: data.pieHabil || data.PieHabil,
          domicilio: data.domicilio || data.Domicilio || '',
          tutor: data.tutor || data.Tutor || { nombre: '', apellido: '', telefono: '', email: '' },
          fichaMedica: data.fichaMedica || data.FichaMedica || { patologias: '', historialLesiones: '', observaciones: '', grupoSanguineo: '' },
          partidos: (data.partidos || data.Partidos || []).map((p: any) => ({
            fecha: p.fecha || p.Fecha,
            rival: p.rival || p.Rival,
            condicion: p.condicion || p.Condicion || 'Local',
            resultado: p.resultado || p.Resultado,
            minutos: p.minutos || p.Minutos || 0
          }))
        };

        const historialString = this.perfil.fichaMedica.historialLesiones || '';
        this.lesiones = historialString
          .split('.')
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0);

        this.cargando = false;
      },
      error: () => {
        this.errorCarga = 'Error al cargar los datos para edición.';
        this.cargando = false;
      }
    });
  }

  get edadCalculada(): string {
    if (!this.perfil.fechaNacimiento) return '-';
    const [anio, mes, dia] = this.perfil.fechaNacimiento.split('-').map(Number);
    if (!anio) return '-';

    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) {
      edad--;
    }
    return `${edad} años`;
  }

  agregarLesion(): void {
    let textoFinal = this.nuevaLesion.trim();

    if (textoFinal) {
      if (this.usarFechaHoy && !textoFinal.includes('(')) {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        textoFinal += ` (${dia}/${mes}/${anio})`;
      }

      this.lesiones.push(textoFinal);
      this.nuevaLesion = '';
      this.sincronizarLesionesSQL();
    }
  }

  eliminarLesion(index: number): void {
    this.lesiones.splice(index, 1);
    this.sincronizarLesionesSQL();
  }

  sincronizarLesionesSQL(): void {
    this.perfil.fichaMedica.historialLesiones = this.lesiones.join('. ') + (this.lesiones.length > 0 ? '.' : '');
  }

  guardar(): void {
    this.guardando = true;

    this.jugadorService.actualizarPerfil(this.jugadorId, this.perfil).subscribe({
      next: () => {
        alert('¡Cambios guardados exitosamente en la base de datos!');
        this.volver();
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Ocurrió un error al guardar los cambios en el servidor.');
        this.guardando = false;
      }
    });
  }

  toggleMenuUsuario(event: MouseEvent): void {
    event.stopPropagation();
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }

  toggleSidebar(): void {
    this.sidebarOculto = !this.sidebarOculto;
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

  selectNav(label: string): void {
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

  volver(): void {
    this.router.navigate(['/admin/ficha-jugador', this.jugadorId]);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
