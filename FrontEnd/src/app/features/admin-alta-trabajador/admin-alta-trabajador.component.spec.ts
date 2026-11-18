import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { AdminAltaTrabajadorComponent } from './admin-alta-trabajador.component';

describe('AdminAltaTrabajadorComponent submission', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAltaTrabajadorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { getToken: () => null, getRol: () => 'Administrador', logout: () => undefined },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  it('does not submit staff again after a successful creation', () => {
    const component = validComponent();

    component.guardarYGenerarQR();
    component.guardarYGenerarQR();
    const request = http.expectOne('/api/staff');
    request.flush({ idStaff: 88 });
    component.guardarYGenerarQR();

    http.expectNone('/api/staff');
    expect(component.nuevoStaffId).toBe(88);
    expect(component.mensajeExito).toBeTrue();
  });

  it('navigates to the created staff profile when the credential popup closes', () => {
    const component = TestBed.createComponent(AdminAltaTrabajadorComponent).componentInstance;
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    component.nuevoStaffId = 88;
    component.mostrarPopupCredencial = true;

    component.cerrarCredencial();

    expect(component.mostrarPopupCredencial).toBeFalse();
    expect(navigate).toHaveBeenCalledOnceWith(['/admin/staff', 88]);
  });

  function validComponent(): AdminAltaTrabajadorComponent {
    const component = TestBed.createComponent(AdminAltaTrabajadorComponent).componentInstance;
    component.dni = '99000003';
    component.nombre = 'Empleado';
    component.apellido = 'Duplicado';
    component.fechaNacimiento = '01/01/1990';
    component.rol = 'MÉDICO';
    component.telefono = '1111111111';
    component.email = 'staff.duplicado@example.test';
    component.password = 'Test.Password.2026!';
    component.repeatPassword = component.password;
    component.domicilio = 'Domicilio de prueba';
    return component;
  }
});
