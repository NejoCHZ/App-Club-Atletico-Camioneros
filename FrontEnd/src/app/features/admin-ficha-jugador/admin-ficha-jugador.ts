import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { JugadorModel } from '../../shared/models/jugador.model';
import { JugadorService } from '../../shared/services/jugador.service';
import { AdminPopupCredencial } from '../admin-popup-credencial/admin-popup-credencial';

@Component({
  selector: 'app-admin-ficha-jugador',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminPopupCredencial],
  templateUrl: './admin-ficha-jugador.html',
  styleUrl: './admin-ficha-jugador.css',
})
export class AdminFichaJugador implements OnInit {
  jugador: JugadorModel | null = null;
  playerId = '';
  cargando = true;
  noEncontrado = false;
  errorCarga = '';
  mostrarPopupCredencial = false;

  readonly sinInformar = 'Sin informar';
  activeTab = 'Jugadores';
  navItems = [
    { label: 'Inicio', icon: 'home', active: false },
    { label: 'Jugadores', icon: 'group', active: true },
    { label: 'Staff', icon: 'badge', active: false },
    { label: 'Categorias', icon: 'category', active: false }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jugadorService: JugadorService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.esGuid(id)) {
      this.cargando = false;
      this.noEncontrado = true;
      return;
    }

    this.playerId = id;
    this.cargarJugador();
  }

  cargarJugador(): void {
    this.cargando = true;
    this.noEncontrado = false;
    this.errorCarga = '';

    this.jugadorService.obtenerPorId(this.playerId).subscribe({
      next: (jugador) => {
        this.jugador = jugador;
        this.cargando = false;
      },
      error: (error: unknown) => {
        this.jugador = null;
        this.cargando = false;
        this.noEncontrado = error instanceof HttpErrorResponse && error.status === 404;
        if (!this.noEncontrado) {
          this.errorCarga = 'No se pudo cargar la ficha. Verificá que la API esté en ejecución.';
        }
      }
    });
  }

  get nombreCompleto(): string {
    return this.jugador ? `${this.jugador.nombre} ${this.jugador.apellido}` : this.sinInformar;
  }

  get fechaNacimiento(): string {
    if (!this.jugador) {
      return this.sinInformar;
    }

    const [anio, mes, dia] = this.jugador.fechaNacimiento.split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : this.sinInformar;
  }

  get edad(): string {
    if (!this.jugador) {
      return this.sinInformar;
    }

    const [anio, mes, dia] = this.jugador.fechaNacimiento.split('-').map(Number);
    if (!anio || !mes || !dia) {
      return this.sinInformar;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) {
      edad--;
    }
    return edad >= 0 ? `${edad} años` : this.sinInformar;
  }

  get tutor(): string {
    return this.jugador?.tutor
      ? `${this.jugador.tutor.nombre} ${this.jugador.tutor.apellido}`
      : this.sinInformar;
  }

  selectNav(label: string): void {
    this.navItems.forEach((item) => item.active = item.label === label);
    this.activeTab = label;
    const rutas: Record<string, string> = {
      Inicio: '/admin',
      Jugadores: '/admin/lista-jugadores',
      Staff: '/admin/staff',
      Categorias: '/admin/categorias',
      Categorías: '/admin/categorias'
    };
    this.router.navigate([rutas[label] ?? '/admin']);
  }

  volver(): void {
    this.router.navigate(['/admin/lista-jugadores']);
  }

  editarPerfil(): void {
    if (this.jugador) {
      this.router.navigate(['/admin/editar-perfil', this.jugador.id]);
    }
  }

  generarCredencial(): void {
    if (this.jugador) {
      this.mostrarPopupCredencial = true;
    }
  }

  descargarCredencial(): void {
    alert(`Descargando credencial de ${this.nombreCompleto}...`);
  }

  private esGuid(valor: string): boolean {
    return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(valor);
  }
}
