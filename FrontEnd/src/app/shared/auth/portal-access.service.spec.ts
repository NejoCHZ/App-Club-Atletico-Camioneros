import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { PortalAccessService } from './portal-access.service';

function token(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('PortalAccessService', () => {
  let role: string;
  let jwt: string;

  beforeEach(() => {
    role = 'Director Técnico';
    jwt = token({ id_categoria: ['2', '7'] });
    TestBed.configureTestingModule({
      providers: [
        PortalAccessService,
        { provide: AuthService, useValue: { getRol: () => role, getToken: () => jwt } },
      ],
    });
  });

  it('limits a coach to every assigned category carried by the token', () => {
    const service = TestBed.inject(PortalAccessService);

    expect(service.visibleCategories([
      { idCategoria: 2, nombreCategoria: '2008' },
      { idCategoria: 5, nombreCategoria: '2010' },
      { idCategoria: 7, nombreCategoria: 'Reserva' },
    ]).map((category) => category.idCategoria)).toEqual([2, 7]);
  });

  it('applies the same assigned-category scope to Preparador Físico', () => {
    role = 'Preparador Físico';
    const service = TestBed.inject(PortalAccessService);

    expect(service.visibleCategories([
      { idCategoria: 2, nombreCategoria: '2008' },
      { idCategoria: 5, nombreCategoria: '2010' },
      { idCategoria: 7, nombreCategoria: 'Reserva' },
    ]).map((category) => category.idCategoria)).toEqual([2, 7]);
    expect(service.capabilities).toEqual({
      canViewAllPlayers: false,
      canEditPlayers: false,
      canViewMedicalRecord: true,
      canEditMedicalRecord: false,
      canManageCategoryRoster: false,
      canManageCategories: false,
      canTakeAttendance: false,
    });
  });

  it('does not client-filter roles that may view the complete roster', () => {
    role = 'Médico';
    jwt = token({});
    const service = TestBed.inject(PortalAccessService);
    const players = [
      { idJugador: 1, nombre: 'Ana', apellido: 'Paz', dni: '1', idCategoria: 99 },
      { idJugador: 2, nombre: 'Luis', apellido: 'Sol', dni: '2' },
    ];

    expect(service.visiblePlayers(players)).toEqual(players);
    expect(service.capabilities.canEditMedicalRecord).toBeTrue();
    expect(service.capabilities.canEditPlayers).toBeFalse();
  });

  it('fails closed when the stored role is unknown', () => {
    role = 'rol-inexistente';
    const service = TestBed.inject(PortalAccessService);

    expect(service.role).toBeNull();
    expect(Object.values(service.capabilities).every((allowed) => !allowed)).toBeTrue();
  });

  it('fails closed when the stored role is absent', () => {
    role = '';
    const service = TestBed.inject(PortalAccessService);

    expect(service.role).toBeNull();
    expect(service.capabilities.canEditPlayers).toBeFalse();
    expect(service.capabilities.canManageCategories).toBeFalse();
  });

  it('keeps the real administrator capabilities', () => {
    role = 'Administrador (Tesorero)';
    const service = TestBed.inject(PortalAccessService);

    expect(service.role).toBe('admin');
    expect(service.capabilities.canEditPlayers).toBeTrue();
    expect(service.capabilities.canManageCategories).toBeTrue();
  });

  it('derives Don QR attendance access from the same canonical capability source', () => {
    role = 'Don QR';
    const service = TestBed.inject(PortalAccessService);

    expect(service.capabilities.canTakeAttendance).toBeTrue();
    expect(service.capabilities.canViewAllPlayers).toBeFalse();
    expect(service.capabilities.canEditPlayers).toBeFalse();
  });
});

