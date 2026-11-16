import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PortalAccessService } from '../auth/portal-access.service';
import { ClubPortalApiService } from './club-portal-api.service';
import { RolePlayerProfile, RolePlayerViewService } from './role-player-view.service';

describe('RolePlayerViewService medical save', () => {
  let service: RolePlayerViewService;
  let api: jasmine.SpyObj<ClubPortalApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ClubPortalApiService>('ClubPortalApiService', [
      'savePlayerMedicalData'
    ]);
    api.savePlayerMedicalData.and.returnValue(of(void 0));

    TestBed.configureTestingModule({ providers: [
      RolePlayerViewService,
      { provide: ClubPortalApiService, useValue: api },
      { provide: PortalAccessService, useValue: { visiblePlayers: (rows: unknown[]) => rows } },
    ] });
    service = TestBed.inject(RolePlayerViewService);
  });

  it('persists medical and physical fields through their scoped endpoints', () => {
    const profile = {
      id: 7, peso: '72,5', altura: '1.78', pieHabil: 'Derecho', grupoSanguineo: 'O+',
      patologias: 'Asma', lesiones: ['Esguince (16/11/2026)'], observacionesMedicas: 'Control',
    } as unknown as RolePlayerProfile;

    service.saveMedical(7, profile).subscribe();

    expect(api.savePlayerMedicalData).toHaveBeenCalledOnceWith(7, jasmine.objectContaining({
      peso: 72.5, altura: 1.78, pieHabil: 'Derecho',
      grupoSanguineo: 'O+', historialLesiones: 'Esguince (16/11/2026)'
    }));
  });

  it('accepts height entered in centimeters', () => {
    const profile = {
      id: 8, peso: '80', altura: '178', pieHabil: '', grupoSanguineo: '',
      patologias: '', lesiones: [], observacionesMedicas: '',
    } as unknown as RolePlayerProfile;

    service.saveMedical(8, profile).subscribe();

    expect(api.savePlayerMedicalData).toHaveBeenCalledWith(8, jasmine.objectContaining({ altura: 1.78 }));
  });
});
