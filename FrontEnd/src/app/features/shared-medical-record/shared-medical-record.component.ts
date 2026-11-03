import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { MedicalRecord, PlayerSummary } from '../../shared/models/portal.models';
import { ClubPortalApiService } from '../../shared/services/club-portal-api.service';

@Component({
  selector: 'app-shared-medical-record',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shared-medical-record.component.html',
  styleUrl: './shared-medical-record.component.css',
})
export class SharedMedicalRecordComponent implements OnInit {
  private readonly api = inject(ClubPortalApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly access = inject(PortalAccessService);

  readonly role = this.access.role;
  readonly canEdit = this.access.capabilities.canEditMedicalRecord;
  player: PlayerSummary | null = null;
  record: MedicalRecord | null = null;
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

    this.api.getPlayer(this.playerId).subscribe({
      next: (player) => this.player = player,
      error: () => this.error = 'No se pudo cargar el jugador.',
    });
    this.api.getMedicalRecord(this.playerId).subscribe({
      next: (record) => {
        this.record = record;
        this.injuries = this.parseInjuries(record.historialLesiones);
        this.loading = false;
      },
      error: () => { this.error = 'No se pudo cargar la ficha médica del jugador.'; this.loading = false; },
    });
  }

  save(): void {
    if (!this.canEdit || !this.record || this.saving) return;
    this.record.historialLesiones = this.injuries.join('\n');
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api.saveMedicalRecord(this.record).subscribe({
      next: () => { this.saving = false; this.success = 'La ficha médica se guardó correctamente.'; },
      error: () => { this.saving = false; this.error = 'No se pudo guardar la ficha médica.'; },
    });
  }

  addInjury(): void {
    const injury = this.newInjury.trim();
    if (!injury) return;
    const value = this.addToday ? `${injury} (${this.todayLabel()})` : injury;
    this.injuries = [...this.injuries, value];
    this.newInjury = '';
  }

  removeInjury(index: number): void {
    this.injuries = this.injuries.filter((_, itemIndex) => itemIndex !== index);
  }

  private parseInjuries(value?: string | null): string[] {
    if (!value) return [];
    return value
      .split(/\r?\n|\.\s+(?=[^.\r\n]*\(\d{2}\/\d{2}\/\d{4}\))|\.\s+(?=[A-ZÁÉÍÓÚÑ])/)
      .map(item => item.trim().replace(/\.$/, ''))
      .filter(Boolean);
  }

  private todayLabel(): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date());
  }
}
