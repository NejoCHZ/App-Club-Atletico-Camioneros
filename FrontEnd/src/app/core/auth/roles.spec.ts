import {
  AppRole,
  categoryNavLabel,
  homeForRole,
  normalizeRole,
  roleCapabilities,
  roleIdForRole,
  RoleId,
} from './roles';

describe('role helpers', () => {
  it('normalizes API role variants', () => {
    expect(normalizeRole('Administrador')).toBe('admin');
    expect(normalizeRole('Administrador (Tesorero)')).toBe('admin');
    expect(normalizeRole('Médico')).toBe('medico');
    expect(normalizeRole('Director Técnico')).toBe('dt');
    expect(normalizeRole('Preparador Físico')).toBe('preparador-fisico');
    expect(normalizeRole('6')).toBe('preparador-fisico');
    expect(normalizeRole('7')).toBe('coordinador');
    expect(normalizeRole('Don QR')).toBe('don-qr');
  });

  it('uses the assigned-category label for DT and Preparador Físico', () => {
    expect(categoryNavLabel('dt')).toBe('Mis categorías');
    expect(categoryNavLabel('preparador-fisico')).toBe('Mis categorías');
    expect(categoryNavLabel('admin')).toBe('Categorías');
  });

  it('rejects unknown roles instead of granting a fallback role', () => {
    expect(normalizeRole('unknown')).toBeNull();
  });

  it('maps every role to its canonical home', () => {
    expect(homeForRole('admin')).toBe('/admin/portales');
    expect(homeForRole('don-qr')).toBe('/semaforo-qr');
    expect(homeForRole('preparador-fisico')).toBe('/preparador-fisico');
  });

  it('derives every portal capability from the canonical semantic capability map', () => {
    const expected: Record<AppRole, ReturnType<typeof roleCapabilities>> = {
      admin: {
        canViewAllPlayers: true,
        canEditPlayers: true,
        canViewMedicalRecord: true,
        canEditMedicalRecord: true,
        canManageCategoryRoster: true,
        canManageCategories: true,
        canTakeAttendance: true,
      },
      coordinador: {
        canViewAllPlayers: true,
        canEditPlayers: false,
        canViewMedicalRecord: true,
        canEditMedicalRecord: false,
        canManageCategoryRoster: true,
        canManageCategories: false,
        canTakeAttendance: false,
      },
      medico: {
        canViewAllPlayers: true,
        canEditPlayers: false,
        canViewMedicalRecord: true,
        canEditMedicalRecord: true,
        canManageCategoryRoster: false,
        canManageCategories: false,
        canTakeAttendance: false,
      },
      dt: {
        canViewAllPlayers: false,
        canEditPlayers: false,
        canViewMedicalRecord: true,
        canEditMedicalRecord: false,
        canManageCategoryRoster: false,
        canManageCategories: false,
        canTakeAttendance: true,
      },
      'preparador-fisico': {
        canViewAllPlayers: false,
        canEditPlayers: false,
        canViewMedicalRecord: true,
        canEditMedicalRecord: false,
        canManageCategoryRoster: false,
        canManageCategories: false,
        canTakeAttendance: false,
      },
      'don-qr': {
        canViewAllPlayers: false,
        canEditPlayers: false,
        canViewMedicalRecord: false,
        canEditMedicalRecord: false,
        canManageCategoryRoster: false,
        canManageCategories: false,
        canTakeAttendance: true,
      },
    };

    for (const role of Object.keys(expected) as AppRole[]) {
      expect(roleCapabilities(role)).withContext(role).toEqual(expected[role]);
    }
  });

  it('maps each portal role to the same canonical role id used by guards', () => {
    expect(roleIdForRole('admin')).toBe(RoleId.Administrador);
    expect(roleIdForRole('coordinador')).toBe(RoleId.Coordinador);
    expect(roleIdForRole('medico')).toBe(RoleId.Medico);
    expect(roleIdForRole('dt')).toBe(RoleId.DirectorTecnico);
    expect(roleIdForRole('preparador-fisico')).toBe(RoleId.PreparadorFisico);
    expect(roleIdForRole('don-qr')).toBe(RoleId.DonQr);
    expect(roleIdForRole(null)).toBeNull();
  });

  it('denies every derived capability when the role is absent', () => {
    expect(Object.values(roleCapabilities(null)).every((allowed) => !allowed)).toBeTrue();
  });
});
