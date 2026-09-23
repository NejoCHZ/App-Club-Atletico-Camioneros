import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { JugadorService } from '../../shared/services/jugador.service';
import { JugadorVista } from '../../shared/models/jugador.model';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-jugadores.html',
  styleUrls: ['./admin-lista-jugadores.css']
})
export class AdminListaJugadores implements OnInit {
  private jugadorService = inject(JugadorService);
  private router = inject(Router);
  private authService = inject(AuthService);

  cargando = true;
  errorCarga = '';
  searchTerm = '';
  posicionFiltro = '';

  jugadoresOriginales: JugadorVista[] = [];
  filteredPlayers: JugadorVista[] = [];

  navItems = [
    { label: 'Inicio', icon: 'home', route: '/admin', active: false },
    { label: 'Jugadores', icon: 'group', route: '/admin/lista-jugadores', active: true },
    { label: 'Categorías', icon: 'category', route: '/admin/categorias', active: false },
    { label: 'Credenciales', icon: 'badge', route: '/admin-popup-credencial', active: false }
  ];

  ngOnInit(): void {
    this.cargarJugadores();
  }

  cargarJugadores() {
    this.jugadorService.obtenerTodos().subscribe({
      next: (data: any[]) => {
        this.jugadoresOriginales = data.map(j => {
          const nombre = j.nombre || j.Nombre || '';
          const apellido = j.apellido || j.Apellido || '';
          const dni = j.dni || j.Dni || '-';

          // Mapeo exacto de las propiedades que envía el backend C#
          const fechaNac = j.fechaDeNacimiento || j.FechaDeNacimiento || '';
          const categoria = j.nombreCategoria || j.NombreCategoria || '-';

          // Homologamos la base de datos con tus botones de filtro
          let posicion = (j.posicionCancha || j.PosicionCancha || '').toUpperCase();
          if (posicion === 'MEDIOCAMPISTA') posicion = 'VOLANTE';
          if (!posicion) posicion = '-';

          const id = j.idJugador || j.IdJugador || 0;

          return {
            ...j,
            id: id,
            nombre: nombre,
            apellido: apellido,
            dni: dni,
            categoria: categoria,
            posicion: posicion,
            nombreCompleto: nombre || apellido ? `${nombre} ${apellido}`.trim() : 'SIN DATOS',
            edad: this.calcularEdad(fechaNac)
          };
        });

        this.filteredPlayers = [...this.jugadoresOriginales];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar jugadores:', err);
        this.errorCarga = 'Ocurrió un error al cargar los jugadores desde el servidor.';
        this.cargando = false;
      }
    });
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  togglePosicion(posicion: string) {
    this.posicionFiltro = this.posicionFiltro === posicion ? '' : posicion;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.filteredPlayers = this.jugadoresOriginales.filter(p => {
      const matchPosicion = this.posicionFiltro ? p.posicion === this.posicionFiltro : true;
      const matchNombre = this.searchTerm
        ? p.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return matchPosicion && matchNombre;
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  editarJugador(id: number) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }

  verFicha(id: number) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }
}
