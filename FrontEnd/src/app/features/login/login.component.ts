import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { homeForRole, normalizeRole } from '../../core/auth/roles';

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
  private readonly route = inject(ActivatedRoute);

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
        const role = normalizeRole(this.authService.getRol());
        if (!role) {
          const rawRole = String(this.authService.getRol() ?? '').trim().toLowerCase();
          this.authService.logout();
          this.errorMessage = rawRole === '2' || rawRole.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'administrativo'
            ? 'El rol Administrativo todavía no tiene un portal habilitado. Contactá a un administrador para solicitar acceso.'
            : 'Tu usuario no tiene un rol habilitado. Contactá a un administrador para revisar el acceso.';
          return;
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
          ? returnUrl
          : null;
        this.router.navigateByUrl(safeReturnUrl ?? homeForRole(role));
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de login:', err);
        this.errorMessage = 'Credenciales incorrectas o usuario inactivo.';
      }
    });
  }
}
