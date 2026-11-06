import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm: FormGroup;
  loginError = signal<boolean>(false);
  hidePassword = signal<boolean>(true);

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      recordarme: [false],
    });
  }

  ngOnInit() {
    // Si el usuario ya tiene sesión, lo redirigimos automáticamente a su panel
    if (this.authService.estaLogueado()) {
      this.router.navigate(['/mis-incidencias']);
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.loginError.set(false);

          // Verificamos el rol para redirigir a la pantalla correcta
          const rol = this.authService.getRol();
          if (rol === 'ROLE_ADMIN' || rol === 'ADMIN') {
            this.router.navigate(['/incidencia-lista']);
          } else {
            this.router.navigate(['/mis-incidencias']);
          }
        },
        error: (err) => {
          console.error('Error al iniciar sesión', err);
          this.loginForm.get('password')?.reset();
          this.loginError.set(true); // Muestra la alerta roja
        },
      });
    }
  }

  // Método temporal para facilitar tus pruebas durante el desarrollo
  autocompletarAdmin() {
    this.loginForm.patchValue({
      correo: 'admin@municipalidad.gob.pe',
      password: 'admin123',
      recordarme: true,
    });
  }
}
