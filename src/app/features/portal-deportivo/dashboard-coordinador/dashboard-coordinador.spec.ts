import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardCoordinador } from './dashboard-coordinador';

describe('DashboardCoordinador', () => {
  let component: DashboardCoordinador;
  let fixture: ComponentFixture<DashboardCoordinador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCoordinador],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCoordinador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
