import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  jugadorId = '';
  cargando = true;
  guardando = false;
  errorCarga = '';

  perfil: any = {};

  lesiones: string[] = [];
  nuevaLesion = '';
  usarFechaHoy = true; // Variable para controlar el checkbox automático

  navItems = [
    { label: 'Inicio', icon: 'home', route: '/admin' },
    { label: 'Jugadores', icon: 'group', route: '/admin/lista-jugadores' },
    { label: 'Categorías', icon: 'category', route: '/admin/categorias' }
  ];

  posiciones = ['ARQUERO', 'DEFENSOR', 'VOLANTE', 'DELANTERO'];
  pies = ['Derecho', 'Izquierdo', 'Ambidiestro'];
  gruposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jugadorService: JugadorService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.volver();
      return;
    }
    this.jugadorId = id;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.jugadorService.obtenerPorId(this.jugadorId).subscribe({
      next: (data: any) => {
        const fechaRaw = data.fechaDeNacimiento || data.FechaDeNacimiento || '';
        const fechaCorta = fechaRaw ? fechaRaw.split('T')[0] : '';

        this.perfil = {
          id: data.idJugador || data.IdJugador,
          nombre: data.nombre || data.Nombre,
          apellido: data.apellido || data.Apellido,
          dni: data.dni || data.Dni,
          fechaNacimiento: fechaCorta,
          posicion: data.posicionCancha || data.PosicionCancha,
          categoria: data.nombreCategoria || data.NombreCategoria,
          peso: data.peso || data.Peso,
          altura: data.altura || data.Altura,
          pieHabil: data.pieHabil || data.PieHabil,
          domicilio: 'Calle falsa 123',
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

  // --- LÓGICA DE LESIONES CON FECHA INTELIGENTE ---
  agregarLesion(): void {
    let textoFinal = this.nuevaLesion.trim();

    if (textoFinal) {
      // Si el checkbox está marcado y el usuario no escribió ya unos paréntesis, inyectamos la fecha
      if (this.usarFechaHoy && !textoFinal.includes('(')) {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        textoFinal += ` (${dia}/${mes}/${anio})`;
      }

      this.lesiones.push(textoFinal);
      this.nuevaLesion = ''; // Limpiamos el input
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

    // Llamada real al backend
    this.jugadorService.actualizarPerfil(this.jugadorId, this.perfil).subscribe({
      next: () => {
        alert('¡Cambios guardados exitosamente en la base de datos!');
        this.volver(); // Te devuelve a la ficha para ver los cambios aplicados
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Ocurrió un error al guardar los cambios en el servidor.');
        this.guardando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/ficha-jugador', this.jugadorId]);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
