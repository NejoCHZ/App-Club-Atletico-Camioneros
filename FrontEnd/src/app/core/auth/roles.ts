export type AppRole = 'admin' | 'coordinador' | 'medico' | 'dt' | 'don-qr';

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
  [RoleId.DirectorTecnico]: ['players:read:assigned', 'medical:read', 'categories:read:assigned'],
  [RoleId.DonQr]: ['attendance:scan'],
  [RoleId.PreparadorFisico]: ['players:read:assigned', 'medical:read', 'categories:read:assigned'],
  [RoleId.Coordinador]: ['players:read:all', 'medical:read', 'categories:read:all', 'categories:membership']
};

const roleAliases: Record<string, AppRole> = {
  '1': 'admin',
  tesorero: 'admin',
  administrador: 'admin',
  'administrador (tesorero)': 'admin',
  admin: 'admin',
  '3': 'medico',
  medico: 'medico',
  '4': 'dt',
  '6': 'dt',
  'preparador fisico': 'dt',
  dt: 'dt',
  tecnico: 'dt',
  'director tecnico': 'dt',
  entrenador: 'dt',
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
  return role === 'don-qr' ? '/semaforo-qr' : `/${role}`;
}

export function hasCapability(roleId: RoleId | null, capability: Capability): boolean {
  return roleId !== null && (capabilitiesByRole[roleId]?.includes(capability) ?? false);
}
