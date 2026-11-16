import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RolePlayerViewService } from '../../shared/services/role-player-view.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';

export interface PlayerCategoriaDT {
  id: number;
  nombreCompleto: string;
  dni: string;
  posicion: 'Arqueros' | 'Defensores' | 'Volantes' | 'Delanteros';
  edad: string;
  fechaNacimiento: string;
  categoria: string;
}

@Component({
  selector: 'app-dt-categoria-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dt-categoria-jugadores.html',
  styleUrl: './dt-categoria-jugadores.css'
})
export class DtCategoriaJugadoresComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private views: RolePlayerViewService,
    private access: PortalAccessService,
  ) {}

  nombreCategoria = 'Plantel';
  searchTerm = '';
  posicionFiltro = '';


  players: PlayerCategoriaDT[] = [];
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const source = id > 0 ? this.views.categoryPlayers(id) : this.views.players();
    source.subscribe(players => this.players = players.map(player => ({ ...player, posicion: this.pluralPosition(player.posicion) })) as PlayerCategoriaDT[]);
  }
  private pluralPosition(position: string): PlayerCategoriaDT['posicion'] {
    const values: Record<string, PlayerCategoriaDT['posicion']> = { ARQUERO: 'Arqueros', DEFENSOR: 'Defensores', VOLANTE: 'Volantes', DELANTERO: 'Delanteros' };
    return values[position] ?? 'Volantes';
  }

  get filteredPlayers(): PlayerCategoriaDT[] {
    return this.players.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.dni.includes(this.searchTerm);
      const matchPos = !this.posicionFiltro || p.posicion === this.posicionFiltro;
      return matchSearch && matchPos;
    });
  }

  togglePosicion(posicion: 'Arqueros' | 'Defensores' | 'Volantes' | 'Delanteros') {
    if (this.posicionFiltro === posicion) {
      this.posicionFiltro = '';
    } else {
      this.posicionFiltro = posicion;
    }
  }

  verFicha(id: number) {
    this.router.navigate([`/${this.access.role}`, 'jugadores', id]);
  }

  positionLabel(position: PlayerCategoriaDT['posicion']): string {
    const labels: Record<PlayerCategoriaDT['posicion'], string> = {
      Arqueros: 'Arquero',
      Defensores: 'Defensor',
      Volantes: 'Volante',
      Delanteros: 'Delantero',
    };
    return labels[position];
  }

}
