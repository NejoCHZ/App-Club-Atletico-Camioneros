import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JugadorModel } from '../../shared/models/jugador.model';
import { JugadorService } from '../../shared/services/jugador.service';
import { AuthService } from '../../shared/services/auth.service';
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
  mostrarPopupFichaMedica = false;

  readonly sinInformar = 'Sin informar';

  navItems = [
    { label: 'Inicio', icon: 'home', route: '/admin' },
    { label: 'Jugadores', icon: 'group', route: '/admin/lista-jugadores' },
    { label: 'Categorías', icon: 'category', route: '/admin/categorias' },
    { label: 'Credenciales', icon: 'badge', route: '/admin-popup-credencial' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jugadorService: JugadorService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
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
      next: (data: any) => {
        const fechaRaw = data.fechaDeNacimiento || data.FechaDeNacimiento || '';
        const fechaCorta = fechaRaw ? fechaRaw.split('T')[0] : '';

        // MAPEO COMPLETO HACIA ANGULAR
        this.jugador = {
          id: data.idJugador || data.IdJugador || 0,
          dni: data.dni || data.Dni || '',
          nombre: data.nombre || data.Nombre || '',
          apellido: data.apellido || data.Apellido || '',
          fechaNacimiento: fechaCorta,
          categoria: data.nombreCategoria || data.NombreCategoria || '-',
          posicion: data.posicionCancha || data.PosicionCancha || '-',
          clubOrigen: data.clubOrigen || data.ClubOrigen || null,
          aptoFisico: data.fichaMedicaLiga !== undefined ? data.fichaMedicaLiga : (data.FichaMedicaLiga || false),
          tutor: data.tutor || data.Tutor || null,

          // Medidas físicas y médicas
          peso: data.peso || data.Peso || null,
          altura: data.altura || data.Altura || null,
          pieHabil: data.pieHabil || data.PieHabil || null,
          fichaMedica: data.fichaMedica || data.FichaMedica || null,

          // Mapeo exhaustivo del Historial de Partidos (incluyendo Condición)
          partidos: (data.partidos || data.Partidos || []).map((p: any) => ({
            fecha: p.fecha || p.Fecha,
            rival: p.rival || p.Rival,
            condicion: p.condicion || p.Condicion || 'Local',
            resultado: p.resultado || p.Resultado,
            minutos: p.minutos || p.Minutos || 0
          }))
        };
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
    if (!this.jugador || !this.jugador.fechaNacimiento) return this.sinInformar;
    const [anio, mes, dia] = this.jugador.fechaNacimiento.split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : this.sinInformar;
  }

  get edad(): string {
    if (!this.jugador || !this.jugador.fechaNacimiento) return this.sinInformar;
    const [anio, mes, dia] = this.jugador.fechaNacimiento.split('-').map(Number);
    if (!anio || !mes || !dia) return this.sinInformar;

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

  // Calculadora segura de minutos totales para el HTML
  get totalMinutosJugados(): string | number {
    if (!this.jugador || !this.jugador.partidos || this.jugador.partidos.length === 0) {
      return this.sinInformar;
    }
    return this.jugador.partidos.reduce((acc, curr) => acc + curr.minutos, 0);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
}
