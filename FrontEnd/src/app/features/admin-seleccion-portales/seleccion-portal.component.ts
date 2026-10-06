import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-seleccion-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccion-portal.component.html',
  styleUrl: './seleccion-portal.component.css'
})
export class SeleccionPortalComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    // 1. Verificamos si el usuario está autenticado
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    // 2. Control de Accesos (RBAC): El Administrador (Tesorero) es el único con acceso a esta pantalla
    const rol = (this.authService.getRol() || '').trim().toLowerCase();
    const esAdmin = rol.includes('tesorero') || rol.includes('administrador') || rol === '1';

    if (!esAdmin) {
      // Si no es el administrador, lo redirigimos forzosamente a su área de trabajo según su rol
      if (rol.includes('coordinador') || rol === '7') {
        this.router.navigate(['/coordinador']);
      } else if (rol.includes('técnico') || rol.includes('tecnico') || rol.includes('dt') || rol === '4') {
        this.router.navigate(['/dt']);
      } else if (rol.includes('médico') || rol.includes('medico') || rol === '3') {
        this.router.navigate(['/medico']);
      } else if (rol.includes('administrativo') || rol === '2') {
        this.router.navigate(['/admin']);
      } else if (rol.includes('qr') || rol === '5') {
        this.router.navigate(['/semaforo-qr']);
      } else if (rol.includes('físico') || rol.includes('fisico') || rol === '6') {
        this.router.navigate(['/dt']);
      } else {
        this.cerrarSesion();
      }
    }
  }

  // Método para redirigir según el portal seleccionado
  navegar(portal: 'administrativo' | 'deportivo' | 'personas'): void {
    switch (portal) {
      case 'administrativo':
        alert('El Portal Administrativo se encuentra en desarrollo.');
        break;
      case 'deportivo':
        // Redirige al panel principal del administrador / tesorero
        this.router.navigate(['/admin']);
        break;
      case 'personas':
        // Redirige a la pantalla de selección de altas (staff y jugadores)
        this.router.navigate(['/admin/registro-personas']);
        break;
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
