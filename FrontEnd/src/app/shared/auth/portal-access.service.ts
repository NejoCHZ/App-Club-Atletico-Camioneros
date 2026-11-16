import { Injectable, inject } from '@angular/core';
import { AppRole, normalizeRole } from '../../core/auth/roles';
import { CategorySummary, PlayerSummary } from '../models/portal.models';
import { AuthService } from '../services/auth.service';
import { assignedCategoryScope } from './assigned-categories';
import { ROLE_CAPABILITIES, RoleCapabilities } from './role-capabilities';

@Injectable({ providedIn: 'root' })
export class PortalAccessService {
  private readonly auth = inject(AuthService);

  get role(): AppRole {
    return normalizeRole(this.auth.getRol()) ?? 'admin';
  }

  get capabilities(): RoleCapabilities {
    return ROLE_CAPABILITIES[this.role];
  }

  categoryIsVisible(category: Pick<CategorySummary, 'idCategoria' | 'nombreCategoria'>): boolean {
    if (!this.isCategoryScopedRole) return true;
    const scope = assignedCategoryScope(this.auth.getToken());
    return scope.ids.has(category.idCategoria) || scope.names.has(this.normalize(category.nombreCategoria));
  }

  playerIsVisible(player: Pick<PlayerSummary, 'idCategoria' | 'nombreCategoria'>): boolean {
    if (!this.isCategoryScopedRole) return true;
    const scope = assignedCategoryScope(this.auth.getToken());
    return (player.idCategoria != null && scope.ids.has(Number(player.idCategoria))) ||
      (player.nombreCategoria != null && scope.names.has(this.normalize(player.nombreCategoria)));
  }

  visibleCategories<T extends CategorySummary>(categories: T[]): T[] {
    return categories.filter((category) => this.categoryIsVisible(category));
  }

  visiblePlayers<T extends PlayerSummary>(players: T[]): T[] {
    return players.filter((player) => this.playerIsVisible(player));
  }

  private get isCategoryScopedRole(): boolean {
    return this.role === 'dt' || this.role === 'preparador-fisico';
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase('es');
  }
}

