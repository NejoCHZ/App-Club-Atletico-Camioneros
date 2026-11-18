export type AppRole = 'admin' | 'coordinador' | 'medico' | 'dt' | 'preparador-fisico' | 'don-qr';

export enum RoleId {
  Administrador = 1,
  Administrativo = 2,
  Medico = 3,
  DirectorTecnico = 4,
  DonQr = 5,
  PreparadorFisico = 6,
  Coordinador = 7
}

export type Capability =
  | 'admin' | 'players:read:all' | 'players:read:assigned' | 'players:write'
  | 'medical:read' | 'medical:write' | 'categories:read:all'
  | 'categories:read:assigned' | 'categories:membership' | 'attendance:scan';

const capabilitiesByRole: Record<RoleId, readonly Capability[]> = {
  [RoleId.Administrador]: ['admin', 'players:read:all', 'players:write', 'medical:read', 'medical:write', 'categories:read:all', 'categories:membership', 'attendance:scan'],
  [RoleId.Administrativo]: ['medical:read'],
  [RoleId.Medico]: ['players:read:all', 'medical:read', 'medical:write', 'categories:read:all'],
  [RoleId.DirectorTecnico]: ['players:read:assigned', 'medical:read', 'categories:read:assigned', 'attendance:scan'],
  [RoleId.DonQr]: ['attendance:scan'],
  [RoleId.PreparadorFisico]: ['players:read:assigned', 'medical:read', 'categories:read:assigned'],
  [RoleId.Coordinador]: ['players:read:all', 'medical:read', 'categories:read:all', 'categories:membership']
};

const roleIds: Record<AppRole, RoleId> = {
  admin: RoleId.Administrador,
  coordinador: RoleId.Coordinador,
  medico: RoleId.Medico,
  dt: RoleId.DirectorTecnico,
  'preparador-fisico': RoleId.PreparadorFisico,
  'don-qr': RoleId.DonQr,
};

export interface RoleCapabilities {
  canViewAllPlayers: boolean;
  canEditPlayers: boolean;
  canViewMedicalRecord: boolean;
  canEditMedicalRecord: boolean;
  canManageCategoryRoster: boolean;
  canManageCategories: boolean;
  canTakeAttendance: boolean;
}

const DENIED_CAPABILITIES: Readonly<RoleCapabilities> = Object.freeze({
  canViewAllPlayers: false,
  canEditPlayers: false,
  canViewMedicalRecord: false,
  canEditMedicalRecord: false,
  canManageCategoryRoster: false,
  canManageCategories: false,
  canTakeAttendance: false,
});

const roleAliases: Record<string, AppRole> = {
  '1': 'admin',
  tesorero: 'admin',
  administrador: 'admin',
  'administrador (tesorero)': 'admin',
  admin: 'admin',
  '3': 'medico',
  medico: 'medico',
  '4': 'dt',
  dt: 'dt',
  tecnico: 'dt',
  'director tecnico': 'dt',
  entrenador: 'dt',
  '6': 'preparador-fisico',
  preparador: 'preparador-fisico',
  'preparador fisico': 'preparador-fisico',
  'preparador-fisico': 'preparador-fisico',
  '5': 'don-qr',
  qr: 'don-qr',
  'don qr': 'don-qr',
  'don-qr': 'don-qr',
  '7': 'coordinador',
  coordinador: 'coordinador',
};

export function normalizeRole(value: string | null | undefined): AppRole | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return roleAliases[normalized] ?? null;
}

export function homeForRole(role: AppRole): string {
  if (role === 'admin') return '/admin/portales';
  if (role === 'don-qr') return '/semaforo-qr';
  return `/${role}`;
}

export function categoryNavLabel(role: AppRole | null): string {
  return role === 'dt' || role === 'preparador-fisico' ? 'Mis categorías' : 'Categorías';
}

export function hasCapability(roleId: RoleId | null, capability: Capability): boolean {
  return roleId !== null && (capabilitiesByRole[roleId]?.includes(capability) ?? false);
}

export function roleIdForRole(role: AppRole | null): RoleId | null {
  return role ? roleIds[role] : null;
}

export function roleCapabilities(role: AppRole | null): Readonly<RoleCapabilities> {
  const roleId = roleIdForRole(role);
  if (roleId === null) return DENIED_CAPABILITIES;

  return {
    canViewAllPlayers: hasCapability(roleId, 'players:read:all'),
    canEditPlayers: hasCapability(roleId, 'players:write'),
    canViewMedicalRecord: hasCapability(roleId, 'medical:read'),
    canEditMedicalRecord: hasCapability(roleId, 'medical:write'),
    canManageCategoryRoster: hasCapability(roleId, 'categories:membership'),
    canManageCategories: hasCapability(roleId, 'admin'),
    canTakeAttendance: hasCapability(roleId, 'attendance:scan'),
  };
}
