import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AppRole } from '../../core/auth/roles';
import { PortalAccessService } from '../../shared/auth/portal-access.service';
import { RoleCapabilities } from '../../shared/auth/role-capabilities';
import { AuthService } from '../../shared/services/auth.service';
import { isResponsiveComponentLoader } from '../../routes/responsive-component';

type Capability = keyof RoleCapabilities;

export interface PortalShellNavItem {
  label: string;
  icon: 'home' | 'group' | 'badge' | 'category';
  path: string;
  capability?: Capability;
}

interface PortalShellConfig {
  heading: string;
  homePath: string;
  nav: readonly PortalShellNavItem[];
}

const PORTAL_SHELLS: Record<Exclude<AppRole, 'don-qr'>, PortalShellConfig> = {
  admin: {
    heading: 'Panel Principal del Administrador',
    homePath: '/admin',
    nav: [
      { label: 'Inicio', icon: 'home', path: '/admin' },
      { label: 'Jugadores', icon: 'group', path: '/admin/jugadores', capability: 'canViewAllPlayers' },
      { label: 'Staff', icon: 'badge', path: '/admin/staff', capability: 'canEditPlayers' },
      { label: 'Categorías', icon: 'category', path: '/admin/categorias', capability: 'canManageCategories' },
    ],
  },
  coordinador: {
    heading: 'Panel Principal del Coordinador',
    homePath: '/coordinador',
    nav: [
      { label: 'Inicio', icon: 'home', path: '/coordinador' },
      { label: 'Jugadores', icon: 'group', path: '/coordinador/jugadores', capability: 'canViewAllPlayers' },
      { label: 'Categorías', icon: 'category', path: '/coordinador/categorias', capability: 'canManageCategoryRoster' },
    ],
  },
  medico: {
    heading: 'Panel Principal del Médico',
    homePath: '/medico',
    nav: [
      { label: 'Inicio', icon: 'home', path: '/medico' },
      { label: 'Jugadores', icon: 'group', path: '/medico/jugadores', capability: 'canViewAllPlayers' },
      { label: 'Categorías', icon: 'category', path: '/medico/categorias', capability: 'canViewMedicalRecord' },
    ],
  },
  dt: {
    heading: 'Panel Principal del Director Técnico',
    homePath: '/dt',
    nav: [
      { label: 'Inicio', icon: 'home', path: '/dt' },
      { label: 'Jugadores', icon: 'group', path: '/dt/jugadores', capability: 'canViewMedicalRecord' },
      { label: 'Mis categorías', icon: 'category', path: '/dt/categorias', capability: 'canViewMedicalRecord' },
    ],
  },
  'preparador-fisico': {
    heading: 'Panel Principal del Preparador Físico',
    homePath: '/preparador-fisico',
    nav: [
      { label: 'Inicio', icon: 'home', path: '/preparador-fisico' },
      { label: 'Jugadores', icon: 'group', path: '/preparador-fisico/jugadores', capability: 'canViewMedicalRecord' },
      { label: 'Mis categorías', icon: 'category', path: '/preparador-fisico/categorias', capability: 'canViewMedicalRecord' },
    ],
  },
};

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly access = inject(PortalAccessService);
  private readonly router = inject(Router);
  private readonly destroyed$ = new Subject<void>();
  private mobileViewport = this.isMobileViewport();
  private responsiveReloadPending = false;

  readonly role = this.access.role;
  readonly capabilities = this.access.capabilities;
  readonly shell = PORTAL_SHELLS[this.role === 'don-qr' ? 'admin' : this.role];
  readonly user = this.auth.obtenerDatosUsuario();

  sidebarCollapsed = false;
  mobileSidebarOpen = false;
  userMenuOpen = false;
  desktopChildOwnsShell = false;
  pageTitle = this.shell.heading;

  get navItems(): readonly PortalShellNavItem[] {
    return this.shell.nav.filter((item) => !item.capability || this.capabilities[item.capability]);
  }

  get roleLabel(): string {
    const labels: Record<AppRole, string> = {
      admin: 'Administrador', coordinador: 'Coordinador', medico: 'Médico',
      dt: 'Director Técnico', 'preparador-fisico': 'Preparador Físico', 'don-qr': 'Don QR',
    };
    return labels[this.role];
  }

  get userIdentifier(): string {
    return this.user.email.split('@')[0] || this.user.email;
  }

  ngOnInit(): void {
    this.updatePageTitle();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntil(this.destroyed$))
      .subscribe(() => {
        this.mobileSidebarOpen = false;
        this.userMenuOpen = false;
        this.updatePageTitle();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  toggleSidebar(): void {
    if (this.isMobileViewport()) this.mobileSidebarOpen = !this.mobileSidebarOpen;
    else this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeMobileSidebar(): void { this.mobileSidebarOpen = false; }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  closeUserMenu(): void { this.userMenuOpen = false; }

  @HostListener('document:keydown.escape')
  closeTransientUi(): void {
    this.userMenuOpen = false;
    this.mobileSidebarOpen = false;
  }

  @HostListener('window:resize')
  handleResize(): void {
    const isMobile = this.isMobileViewport();
    if (isMobile !== this.mobileViewport) {
      this.mobileViewport = isMobile;
      if (this.currentRouteUsesResponsiveComponent() && !this.responsiveReloadPending) {
        this.responsiveReloadPending = true;
        window.location.reload();
        return;
      }
    }

    if (!isMobile) this.mobileSidebarOpen = false;
    this.updatePageTitle();
  }

  private currentRouteUsesResponsiveComponent(): boolean {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    return isResponsiveComponentLoader(route.routeConfig?.loadComponent);
  }

  private updatePageTitle(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    this.desktopChildOwnsShell = route.data['desktopOwnShell'] === true;
    if (!this.isMobileViewport()) {
      this.pageTitle = this.shell.heading;
      return;
    }
    const routeTitle = route.title;
    this.pageTitle = routeTitle === 'Portal del entrenador'
      ? this.roleLabel
      : routeTitle || this.shell.heading;
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  }
}
