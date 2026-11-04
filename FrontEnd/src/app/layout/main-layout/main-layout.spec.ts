import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MainLayout } from './main-layout';

class AuthServiceStub {
  role = 'Administrador (Tesorero)';
  logout = jasmine.createSpy('logout');
  getRol(): string { return this.role; }
  getToken(): string | null { return null; }
  obtenerDatosUsuario(): { email: string; rol: string } {
    return { email: 'usuario@camioneros.test', rol: this.role };
  }
}

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  let component: MainLayout;
  let auth: AuthServiceStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [provideRouter([]), { provide: AuthService, useClass: AuthServiceStub }],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    router = TestBed.inject(Router);
  });

  function create(role = 'Administrador (Tesorero)'): void {
    auth.role = role;
    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders the administrator visual shell and canonical links', () => {
    create();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.sidebar')).not.toBeNull();
    expect(element.querySelector('.top-header')).not.toBeNull();
    expect(element.querySelector('.sidebar-header .logo-wrapper .cacc-shield-img')).not.toBeNull();
    expect(element.querySelector('.admin-profile .profile-avatar .cacc-icon-profile')).not.toBeNull();
    expect(element.querySelector('.admin-profile .profile-info .profile-name')?.textContent).toContain('Administrador');
    expect(element.querySelector('.admin-profile .chevron-down svg')).not.toBeNull();
    expect(element.querySelector('.sidebar-footer .portal-btn')?.textContent).toContain('Selección de Portales');
    expect(component.navItems.map((item) => item.path)).toEqual([
      '/admin', '/admin/jugadores', '/admin/staff', '/admin/categorias',
    ]);
    expect(element.querySelector('.profile-email')?.textContent).toContain('usuario');
    expect(element.querySelector('.profile-email')?.textContent).not.toContain('@camioneros.test');
    expect(element.querySelector('.sidebar-footer .portal-btn')?.getAttribute('title')).toBe('Volver a Selección de Portales');
  });

  it('builds the menu from role capabilities', () => {
    create('Coordinador');

    expect(component.navItems.map((item) => item.path)).toEqual([
      '/coordinador', '/coordinador/jugadores', '/coordinador/categorias',
    ]);
    expect(component.navItems.some((item) => item.label === 'Staff')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.portal-btn')).toBeNull();
  });

  it('collapses the sidebar on desktop', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    create();

    component.toggleSidebar();

    expect(component.sidebarCollapsed).toBeTrue();
    expect(component.mobileSidebarOpen).toBeFalse();
  });

  it('opens the drawer on mobile and Escape closes transient UI', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    create();

    component.toggleSidebar();
    component.userMenuOpen = true;
    expect(component.mobileSidebarOpen).toBeTrue();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.mobileSidebarOpen).toBeFalse();
    expect(component.userMenuOpen).toBeFalse();
  });

  it('logs out through AuthService and redirects to login', () => {
    create();
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    component.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
  });
});
