import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { RolePlayerProfile, RolePlayerViewService } from '../../shared/services/role-player-view.service';

@Component({
  selector: 'app-shared-medical-record',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shared-medical-record.component.html',
  styleUrl: './shared-medical-record.component.css',
})
export class SharedMedicalRecordComponent implements OnInit {
  private readonly views = inject(RolePlayerViewService);
  private readonly route = inject(ActivatedRoute);
  private readonly access = inject(PortalAccessService);

  readonly role = this.access.role;
  readonly canEdit = this.access.capabilities.canEditMedicalRecord;
  editMode = false;
  player: RolePlayerProfile | null = null;
  private loadedPlayer: RolePlayerProfile | null = null;
  loading = true;
  saving = false;
  error = '';
  success = '';
  playerId = 0;
  injuries: string[] = [];
  newInjury = '';
  addToday = true;

  ngOnInit(): void {
    this.playerId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.playerId) || this.playerId <= 0) {
      this.error = 'El jugador solicitado no es válido.';
      this.loading = false;
      return;
    }

    this.loadProfile();
  }

  startEditing(): void {
    if (!this.canEdit || !this.player) return;
    this.editMode = true;
    this.success = '';
  }

  cancelEditing(): void {
    if (this.loadedPlayer) this.applyProfile(this.loadedPlayer);
    this.editMode = false;
    this.newInjury = '';
    this.error = '';
  }

  private loadProfile(): void {
    this.loading = true;
    this.views.profile(this.playerId).subscribe({
      next: (player) => {
        this.loadedPlayer = this.cloneProfile(player);
        this.applyProfile(player);
        this.loading = false;
      },
      error: () => { this.error = 'No se pudo cargar la ficha médica del jugador.'; this.loading = false; },
    });
  }

  save(): void {
    if (!this.canEdit || !this.editMode || !this.player || this.saving) return;
    this.player.lesiones = [...this.injuries];
    this.saving = true;
    this.error = '';
    this.success = '';
    this.views.saveMedical(this.playerId, this.player).subscribe({
      next: () => {
        this.saving = false;
        this.editMode = false;
        this.success = 'La ficha médica se guardó correctamente.';
        this.loadProfile();
      },
      error: () => { this.saving = false; this.error = 'No se pudo guardar la ficha médica.'; },
    });
  }

  addInjury(): void {
    if (!this.editMode) return;
    const injury = this.newInjury.trim();
    if (!injury) return;
    const value = this.addToday ? `${injury} (${this.todayLabel()})` : injury;
    this.injuries = [...this.injuries, value];
    this.newInjury = '';
  }

  removeInjury(index: number): void {
    if (!this.editMode) return;
    this.injuries = this.injuries.filter((_, itemIndex) => itemIndex !== index);
  }

  private applyProfile(player: RolePlayerProfile): void {
    this.player = this.cloneProfile(player);
    this.injuries = [...player.lesiones];
  }

  private cloneProfile(player: RolePlayerProfile): RolePlayerProfile {
    return { ...player, lesiones: [...player.lesiones], historialPartidos: [...player.historialPartidos] };
  }

  private todayLabel(): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date());
  }
}
