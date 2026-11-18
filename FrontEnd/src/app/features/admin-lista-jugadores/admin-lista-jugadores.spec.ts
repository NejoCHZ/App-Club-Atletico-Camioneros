import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { AppRole } from '../../core/auth/roles';
import { AdminListaJugadores } from './admin-lista-jugadores';

describe('AdminListaJugadores category match history action', () => {
  function configure(role: AppRole, categoryId?: number) {
    TestBed.configureTestingModule({
      imports: [AdminListaJugadores],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(categoryId ? { id: String(categoryId) } : {}) } } },
        { provide: AuthService, useValue: { getToken: () => null, getRol: () => role, logout: () => undefined } },
        { provide: PortalAccessService, useValue: {
          role,
          capabilities: { canEditPlayers: role === 'admin' },
          visiblePlayers: (players: unknown[]) => players,
        } },
      ],
    });
  }

  for (const role of ['dt', 'preparador-fisico'] as const) {
    it(`shows and navigates the action for ${role} on a category route`, () => {
      configure(role, 7);
      const fixture = TestBed.createComponent(AdminListaJugadores);
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      fixture.componentInstance.categoriaContexto = 'Sub 17';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.category-context__history') as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Ver historial de partidos');
      button.click();
      expect(navigate).toHaveBeenCalledWith([`/${role}`, 'categorias', 7, 'partidos']);
    });
  }

  for (const [role, categoryId] of [
    ['dt', undefined],
    ['preparador-fisico', undefined],
    ['admin', 7],
    ['medico', 7],
    ['coordinador', 7],
  ] as const) {
    it(`hides the action for ${role} with category ${categoryId ?? 'none'}`, () => {
      configure(role, categoryId);
      const fixture = TestBed.createComponent(AdminListaJugadores);
      fixture.componentInstance.categoriaContexto = categoryId ? 'Sub 17' : '';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.category-context__history')).toBeNull();
    });
  }
});
