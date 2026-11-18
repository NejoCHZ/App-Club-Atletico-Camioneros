import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { SharedMedicalRecordComponent } from '../shared-medical-record/shared-medical-record.component';

@Component({
  selector: 'app-coordinador-medical-page', standalone: true,
  imports: [RouterLink, RouterLinkActive, SharedMedicalRecordComponent],
  templateUrl: './coordinador-medical-page.html', styleUrl: './coordinador-medical-page.css',
})
export class CoordinadorMedicalPage {
  private readonly access = inject(PortalAccessService);
  readonly readOnly = !this.access.capabilities.canEditMedicalRecord;
  private readonly auth = inject(AuthService); private readonly router = inject(Router);
  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}
