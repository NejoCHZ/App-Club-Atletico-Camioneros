import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  });

  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        const rol = (this.authService.getRol() || '').trim().toLowerCase();

        console.log('=> RESPUESTA SERVIDOR:', res);
        console.log('=> ROL DETECTADO:', rol);

        // 1. Administrador (Tesorero) -> Selección de Portales
        if (rol.includes('tesorero') || rol.includes('administrador') || rol === '1') {
          console.log('Redirigiendo a /seleccion-portales');
          this.router.navigate(['/seleccion-portales']);
          return;
        }

        // 2. Administrativo -> Portal Administrativo (Finanzas)
        if (rol.includes('administrativo') || rol === '2') {
          this.router.navigate(['/admin']);
          return;
        }

        // 3. Médico -> Portal Deportivo (Salud)
        if (rol.includes('médico') || rol.includes('medico') || rol === '3') {
          this.router.navigate(['/medico']);
          return;
        }

        // 4. Director Técnico -> Portal Deportivo (Su categoría)
        if (rol.includes('técnico') || rol.includes('tecnico') || rol.includes('dt') || rol === '4') {
          this.router.navigate(['/dt']);
          return;
        }

        // 5. Don QR -> WebApp Semáforo QR
        if (rol.includes('qr') || rol === '5') {
          this.router.navigate(['/semaforo-qr']);
          return;
        }

        // 6. Preparador Físico
        if (rol.includes('físico') || rol.includes('fisico') || rol === '6') {
          this.router.navigate(['/dt']);
          return;
        }

        // 7. Coordinador
        if (rol.includes('coordinador') || rol === '7') {
          this.router.navigate(['/coordinador']);
          return;
        }

        // Fallback: Si no coincide ninguno, mandar a selección de portales por ser usuario autenticado
        console.warn('Rol no contemplado, fallback a /seleccion-portales');
        this.router.navigate(['/seleccion-portales']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de login:', err);
        this.errorMessage = 'Credenciales incorrectas o usuario inactivo.';
      }
    });
  }
}
