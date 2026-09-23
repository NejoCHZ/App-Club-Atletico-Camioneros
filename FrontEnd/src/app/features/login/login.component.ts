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
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Conectamos el formulario con los campos 'email' (usuario) y 'password'
  loginForm: FormGroup = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  });

  errorMessage: string = '';
  isLoading: boolean = false;

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          // Leemos el rol que nos devolvió el backend y redirigimos
          const rol = this.authService.getRol();

          if (rol === 'Tesorero') {
            this.router.navigate(['/admin']); 
          } else if (rol === 'Médico') {
            this.router.navigate(['/medico']); 
          } else if (rol === 'Director Técnico') {
            this.router.navigate(['/dt']); 
          } else {
            this.router.navigate(['/coordinador']); 
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Credenciales incorrectas o usuario inactivo.';
        }
      });
    }
  }
}
