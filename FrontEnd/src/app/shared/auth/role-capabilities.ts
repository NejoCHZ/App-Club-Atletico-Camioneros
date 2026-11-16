import { AppRole } from '../../core/auth/roles';

export interface RoleCapabilities {
  canViewAllPlayers: boolean;
  canEditPlayers: boolean;
  canViewMedicalRecord: boolean;
  canEditMedicalRecord: boolean;
  canManageCategoryRoster: boolean;
  canManageCategories: boolean;
}

export const ROLE_CAPABILITIES: Record<AppRole, RoleCapabilities> = {
  admin: {
    canViewAllPlayers: true,
    canEditPlayers: true,
    canViewMedicalRecord: true,
    canEditMedicalRecord: true,
    canManageCategoryRoster: true,
    canManageCategories: true,
  },
  coordinador: {
    canViewAllPlayers: true,
    canEditPlayers: false,
    canViewMedicalRecord: true,
    canEditMedicalRecord: false,
    canManageCategoryRoster: true,
    canManageCategories: false,
  },
  medico: {
    canViewAllPlayers: true,
    canEditPlayers: false,
    canViewMedicalRecord: true,
    canEditMedicalRecord: true,
    canManageCategoryRoster: false,
    canManageCategories: false,
  },
  dt: {
    canViewAllPlayers: false,
    canEditPlayers: false,
    canViewMedicalRecord: true,
    canEditMedicalRecord: false,
    canManageCategoryRoster: false,
    canManageCategories: false,
  },
  'preparador-fisico': {
    canViewAllPlayers: false,
    canEditPlayers: false,
    canViewMedicalRecord: true,
    canEditMedicalRecord: false,
    canManageCategoryRoster: false,
    canManageCategories: false,
  },
  'don-qr': {
    canViewAllPlayers: false,
    canEditPlayers: false,
    canViewMedicalRecord: false,
    canEditMedicalRecord: false,
    canManageCategoryRoster: false,
    canManageCategories: false,
  },
};

