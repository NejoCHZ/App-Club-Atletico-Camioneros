import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JugadorModel, PosicionJugador } from '../../shared/models/jugador.model';
import { JugadorService } from '../../shared/services/jugador.service';

export interface Player {
  id: string;
  nombreCompleto: string;
  dni: string;
  posicion: PosicionJugador;
  edad: string;
  fechaNacimiento: string;
  categoria: string;
}

@Component({
  selector: 'app-admin-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-lista-jugadores.html',
  styleUrl: './admin-lista-jugadores.css',
})
export class AdminListaJugadores implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly jugadorService: JugadorService
  ) {}

  searchTerm = '';
  posicionFiltro: PosicionJugador | '' = '';

  activeTab = 'Jugadores';

  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  players: Player[] = [];
  cargando = true;
  errorCarga = '';

  ngOnInit(): void {
    this.cargarJugadores();
  }

  cargarJugadores(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.jugadorService.obtenerTodos().subscribe({
      next: (jugadores) => {
        this.players = jugadores.map((jugador) => this.mapearPresentacion(jugador));
        this.cargando = false;
      },
      error: () => {
        this.players = [];
        this.errorCarga = 'No se pudo cargar la lista. Verificá que la API esté en ejecución.';
        this.cargando = false;
      }
    });
  }

  private mapearPresentacion(jugador: JugadorModel): Player {
    return {
      id: jugador.id,
      nombreCompleto: `${jugador.nombre} ${jugador.apellido}`,
      dni: jugador.dni,
      posicion: jugador.posicion,
      edad: `${this.calcularEdad(jugador.fechaNacimiento)} AÑOS`,
      fechaNacimiento: jugador.fechaNacimiento,
      categoria: jugador.categoria
    };
  }

  private calcularEdad(fechaNacimiento: string): number {
    const partes = fechaNacimiento.split('-').map(Number);
    if (partes.length !== 3 || partes.some((parte) => !Number.isInteger(parte))) {
      return 0;
    }

    const [anio, mes, dia] = partes as [number, number, number];
    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    const aunNoCumplio = hoy.getMonth() + 1 < mes ||
      (hoy.getMonth() + 1 === mes && hoy.getDate() < dia);

    if (aunNoCumplio) {
      edad--;
    }

    return Math.max(0, edad);
  }

  togglePosicion(posicion: PosicionJugador): void {
    if (this.posicionFiltro === posicion) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = posicion;
    }
  }

  get filteredPlayers(): Player[] {
    return this.players.filter(p => {
      const term = this.searchTerm.trim().toLowerCase();
      const matchSearch = !term || p.nombreCompleto.toLowerCase().includes(term) || p.dni.includes(term);
      const matchPos = !this.posicionFiltro || p.posicion === this.posicionFiltro;
      return matchSearch && matchPos;
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

  verFicha(id: string) {
    this.router.navigate(['/admin/ficha-jugador', id]);
  }

  editarJugador(id: string) {
    this.router.navigate(['/admin/editar-perfil', id]);
  }
}
