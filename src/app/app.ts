import { Component, inject } from '@angular/core';
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
export class App {
  authService = inject(AuthService);
  router = inject(Router);

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
