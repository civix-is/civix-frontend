import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth-service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  // Estado global de Accesibilidad
  mostrarAccesibilidad = signal<boolean>(false);
  altoContraste = signal<boolean>(false);
  escalaTexto = signal<number>(100);
  guiaLectura = signal<boolean>(false);
  reducirMovimiento = signal<boolean>(false);
  posicionGuiaY = signal<number>(220);

  ngOnInit(): void {
    if (this.authService.estaLogueado()) {
      this.authService.cargarDatosUsuario();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.guiaLectura()) {
      this.posicionGuiaY.set(event.clientY);
    }
  }

  toggleAccesibilidad(): void {
    this.mostrarAccesibilidad.update((v) => !v);
  }

  cambiarEscalaTexto(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.escalaTexto.set(val);
    document.documentElement.style.fontSize = `${val}%`;
  }

  toggleAltoContraste(activo: boolean): void {
    this.altoContraste.set(activo);
    document.body.classList.toggle('global-high-contrast', activo);
  }

  toggleReducirMovimiento(activo: boolean): void {
    this.reducirMovimiento.set(activo);
    document.body.classList.toggle('global-reduce-motion', activo);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
