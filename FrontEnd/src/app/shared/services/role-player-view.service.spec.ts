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
      'savePlayerMedicalData', 'listRoster', 'getCategory', 'getPlayer', 'getMedicalRecord'
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

  it('uses the requested category as fallback when roster rows omit category data', () => {
    api.listRoster.and.returnValue(of([{ idJugador: 9, nombreCompleto: 'Jugador', dni: '9', posicionCancha: 'Arquero' }] as any));
    api.getCategory.and.returnValue(of({ idCategoria: 7, nombreCategoria: 'AFA 20067' } as any));

    service.categoryPlayers(7).subscribe(players => {
      expect(players[0].categoria).toBe('AFA 20067');
    });
  });

  it('normalizes legacy zero-based blood groups when loading a profile', () => {
    api.getPlayer.and.returnValue(of({ idJugador: 9, nombre: 'Jugador', apellido: 'Prueba' } as any));
    api.getMedicalRecord.and.returnValue(of({ idFichaMedica: 3, grupoSanguineo: '0+' } as any));

    service.profile(9).subscribe(profile => {
      expect(profile.grupoSanguineo).toBe('O+');
    });
  });
});
