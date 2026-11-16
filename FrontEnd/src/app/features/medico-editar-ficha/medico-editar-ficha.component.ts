import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RolePlayerViewService } from '../../shared/services/role-player-view.service';

export interface PartidoItem {
  dia: string;
  fecha: string;
  rival: string;
  resultado: string;
  minutos: string;
}

export interface PlayerFicha {
  id: number;
  nombreCompleto: string;
  posicion: string;
  fechaNacimiento: string;
  edad: string;
  peso: string;
  altura: string;
  pieHabil: string;
  grupoSanguineo: string;
  tutor: string;
  telefonoTutor: string;
  domicilio: string;
  patologias: string;
  lesiones: string[];
  observacionesMedicas: string;
  historialPartidos: PartidoItem[];
  totalMinutosJugados: string;
}

@Component({
  selector: 'app-medico-editar-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medico-editar-ficha.component.html',
  styleUrl: './medico-editar-ficha.component.css'
})
export class MedicoEditarFichaComponent implements OnInit {
  playerId = 1;
  nuevaLesion = '';
  player: PlayerFicha = {
    id: 1,
    nombreCompleto: 'NOMBRE Y APELLIDO',
    posicion: 'POSICION',
    fechaNacimiento: 'DD/MM/AAAA',
    edad: '00 Años',
    peso: '00 Kg',
    altura: '0.00 m',
    pieHabil: 'Derecho',
    grupoSanguineo: '0 +',
    tutor: 'Nombre y apellido',
    telefonoTutor: '0000000000',
    domicilio: 'Calle falsa 123',
    patologias: '',
    lesiones: ['Lesion 1', 'Lesion 2', 'Lesion 3'],
    observacionesMedicas: '',
    historialPartidos: Array.from({ length: 20 }, (_, i) => ({
      dia: 'DD/MM',
      fecha: `${i + 1}`,
      rival: 'NOMBRE RIVAL',
      resultado: '0 - 0',
      minutos: "00'"
    })),
    totalMinutosJugados: "00'"
  };

  constructor(private route: ActivatedRoute, private router: Router, private views: RolePlayerViewService) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.playerId = Number(idParam);
        this.views.profile(this.playerId).subscribe(player => this.player = player);
      }
    });
  }

  agregarLesion() {
    const descripcion = this.nuevaLesion.trim();
    if (!descripcion) return;

    const fecha = new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date());
    this.player.lesiones.push(`${descripcion} (${fecha})`);
    this.nuevaLesion = '';
  }

  editarLesion(index: number) {
    const actual = this.player.lesiones[index];
    const nuevo = prompt('Editar lesión:', actual);
    if (nuevo !== null && nuevo.trim()) {
      this.player.lesiones[index] = nuevo.trim();
    }
  }

  borrarLesion(index: number) {
    this.player.lesiones.splice(index, 1);
  }

  guardar() {
    this.views.saveMedical(this.playerId, this.player).subscribe(() => this.router.navigate(['/medico/jugadores', this.playerId]));
  }

  cancelar() {
    this.router.navigate(['/medico/jugadores', this.playerId]);
  }

}
